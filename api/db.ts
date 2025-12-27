/**
 * Database integration for storing sensor snapshots
 * Uses SQLite for development (can be swapped for PostgreSQL in production)
 */
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

interface SensorSnapshot {
  stateId: number;
  waitingVehicles: number;
  competingTotal: number;
  secondsElapsed: number;
  decidedState: string;
}

export class Database {
  private db: sqlite3.Database | null = null;

  /**
   * Initialize database connection and create tables if they don't exist
   */
  async initialize(dbPath: string = './traffic_light.db'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  /**
   * Create tables if they don't exist
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db)) as (sql: string, params?: any[]) => Promise<{ lastID: number; changes: number }>;

    // Create states table
    await run(`
      CREATE TABLE IF NOT EXISTS states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create transitions table
    await run(`
      CREATE TABLE IF NOT EXISTS transitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_state_id INTEGER NOT NULL,
        to_state_id INTEGER NOT NULL,
        condition TEXT,
        event_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_state_id) REFERENCES states(id) ON DELETE CASCADE,
        FOREIGN KEY (to_state_id) REFERENCES states(id) ON DELETE CASCADE,
        UNIQUE(from_state_id, to_state_id, event_name)
      )
    `);

    // Create sensor_snapshots table
    await run(`
      CREATE TABLE IF NOT EXISTS sensor_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state_id INTEGER NOT NULL,
        waiting_vehicles INTEGER DEFAULT 0,
        competing_total INTEGER DEFAULT 0,
        seconds_elapsed DECIMAL(10, 2) NOT NULL,
        decided_state VARCHAR(50),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await run(`CREATE INDEX IF NOT EXISTS idx_states_name ON states(name)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_transitions_from_state ON transitions(from_state_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_sensor_snapshots_state ON sensor_snapshots(state_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_sensor_snapshots_timestamp ON sensor_snapshots(timestamp DESC)`);

    // Seed initial data
    await this.seedInitialData();
  }

  /**
   * Seed initial states and transitions
   */
  private async seedInitialData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const run = promisify(this.db.run.bind(this.db)) as (sql: string, params?: any[]) => Promise<{ lastID: number; changes: number }>;

    // Insert states
    await run(`INSERT OR IGNORE INTO states (id, name) VALUES (1, 'RED')`);
    await run(`INSERT OR IGNORE INTO states (id, name) VALUES (2, 'GREEN')`);
    await run(`INSERT OR IGNORE INTO states (id, name) VALUES (3, 'YELLOW')`);

    // Insert transitions
    await run(`
      INSERT OR IGNORE INTO transitions (from_state_id, to_state_id, event_name, condition)
      VALUES (1, 2, 'TIMER_EXPIRED', 'Timer duration >= 30 seconds')
    `);
    await run(`
      INSERT OR IGNORE INTO transitions (from_state_id, to_state_id, event_name, condition)
      VALUES (2, 3, 'TIMER_EXPIRED', 'Timer duration >= 25 seconds')
    `);
    await run(`
      INSERT OR IGNORE INTO transitions (from_state_id, to_state_id, event_name, condition)
      VALUES (3, 1, 'TIMER_EXPIRED', 'Timer duration >= 5 seconds')
    `);
  }

  /**
   * Get state ID by name
   */
  async getStateId(stateName: string): Promise<number | null> {
    if (!this.db) throw new Error('Database not initialized');
    const get = promisify(this.db.get.bind(this.db)) as (sql: string, params: any[]) => Promise<{ id: number } | undefined>;

    const result = await get(`SELECT id FROM states WHERE name = ?`, [stateName]);
    return result?.id ?? null;
  }

  /**
   * Save sensor snapshot to database
   */
  async saveSensorSnapshot(snapshot: SensorSnapshot): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const run = promisify(this.db.run.bind(this.db)) as (sql: string, params?: any[]) => Promise<{ lastID: number; changes: number }>;

    const result = await run(`
      INSERT INTO sensor_snapshots (state_id, waiting_vehicles, competing_total, seconds_elapsed, decided_state)
      VALUES (?, ?, ?, ?, ?)
    `, [
      snapshot.stateId,
      snapshot.waitingVehicles ?? 0,
      snapshot.competingTotal ?? 0,
      snapshot.secondsElapsed,
      snapshot.decidedState
    ]);

    return result.lastID;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      this.db!.close((err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

