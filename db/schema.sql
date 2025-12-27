-- Session 6 - Database Schema for Traffic Light FSM
-- Tables: states, transitions, sensor_snapshots

-- ============================================================================
-- STATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on state name for faster lookups
CREATE INDEX IF NOT EXISTS idx_states_name ON states(name);

-- ============================================================================
-- TRANSITIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_state_id INTEGER NOT NULL,
    to_state_id INTEGER NOT NULL,
    condition TEXT,  -- JSON or text description of transition condition (e.g., "TIMER_EXPIRED", guard function logic)
    event_name VARCHAR(100),  -- Event that triggers this transition (e.g., "TIMER_EXPIRED", "EMERGENCY_OVERRIDE")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_state_id) REFERENCES states(id) ON DELETE CASCADE,
    FOREIGN KEY (to_state_id) REFERENCES states(id) ON DELETE CASCADE,
    UNIQUE(from_state_id, to_state_id, event_name)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_transitions_from_state ON transitions(from_state_id);
CREATE INDEX IF NOT EXISTS idx_transitions_to_state ON transitions(to_state_id);
CREATE INDEX IF NOT EXISTS idx_transitions_event ON transitions(event_name);

-- ============================================================================
-- SENSOR_SNAPSHOTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sensor_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state_id INTEGER NOT NULL,
    waiting_vehicles INTEGER DEFAULT 0,  -- Vehicles waiting in local lanes
    competing_total INTEGER DEFAULT 0,   -- Total vehicles in competing/cross traffic
    seconds_elapsed DECIMAL(10, 2) NOT NULL,  -- Time elapsed in current state (seconds, with decimal precision)
    decided_state VARCHAR(50),  -- The state decided/computed for this snapshot
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
);

-- Indexes for querying sensor data
CREATE INDEX IF NOT EXISTS idx_sensor_snapshots_state ON sensor_snapshots(state_id);
CREATE INDEX IF NOT EXISTS idx_sensor_snapshots_timestamp ON sensor_snapshots(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_snapshots_decided_state ON sensor_snapshots(decided_state);

-- Composite index for time-series queries
CREATE INDEX IF NOT EXISTS idx_sensor_snapshots_state_timestamp ON sensor_snapshots(state_id, timestamp DESC);

-- ============================================================================
-- INITIAL DATA: Insert default states
-- ============================================================================
INSERT OR IGNORE INTO states (id, name) VALUES
    (1, 'RED'),
    (2, 'GREEN'),
    (3, 'YELLOW');

-- ============================================================================
-- INITIAL DATA: Insert default transitions (from TrafficLightController.ts)
-- ============================================================================
-- RED -> GREEN (on TIMER_EXPIRED)
INSERT OR IGNORE INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (1, 2, 'TIMER_EXPIRED', 'Timer duration >= 30 seconds');

-- GREEN -> YELLOW (on TIMER_EXPIRED)
INSERT OR IGNORE INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (2, 3, 'TIMER_EXPIRED', 'Timer duration >= 25 seconds');

-- YELLOW -> RED (on TIMER_EXPIRED)
INSERT OR IGNORE INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (3, 1, 'TIMER_EXPIRED', 'Timer duration >= 5 seconds');

-- Optional: Emergency override transitions (from '*' -> RED)
-- These would use from_state_id = NULL or a special wildcard state
-- For simplicity, we'll use a placeholder state_id = 0 for wildcard transitions
INSERT OR IGNORE INTO states (id, name) VALUES (0, '*');
INSERT OR IGNORE INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (0, 1, 'EMERGENCY_OVERRIDE', 'Emergency vehicle detected - force to RED');

