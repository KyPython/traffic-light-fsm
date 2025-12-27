# Session 6 - Database Schema for Traffic Light FSM

Database schema with three core tables: `states`, `transitions`, and `sensor_snapshots`.

## Schema Overview

### 1. `states` Table
Stores available traffic light states.

| Column      | Type        | Description                    |
|-------------|-------------|--------------------------------|
| id          | INTEGER     | Primary key (auto-increment)   |
| name        | VARCHAR(50) | State name (RED, GREEN, YELLOW)|
| created_at  | TIMESTAMP   | Creation timestamp             |
| updated_at  | TIMESTAMP   | Last update timestamp          |

### 2. `transitions` Table
Defines valid state transitions with conditions.

| Column         | Type         | Description                                    |
|----------------|--------------|------------------------------------------------|
| id             | INTEGER      | Primary key (auto-increment)                   |
| from_state_id  | INTEGER      | Source state ID (FK to states.id)              |
| to_state_id    | INTEGER      | Target state ID (FK to states.id)              |
| condition      | TEXT         | Transition condition description               |
| event_name     | VARCHAR(100) | Event that triggers transition (e.g., TIMER_EXPIRED) |
| created_at     | TIMESTAMP    | Creation timestamp                             |

**Note:** Uses state_id = 0 (wildcard state '*') for global transitions that can trigger from any state.

### 3. `sensor_snapshots` Table
Records sensor data snapshots for analysis and decision tracking.

| Column          | Type           | Description                              |
|-----------------|----------------|------------------------------------------|
| id              | INTEGER        | Primary key (auto-increment)             |
| state_id        | INTEGER        | Current state ID (FK to states.id)       |
| waiting_vehicles| INTEGER        | Vehicles waiting in local lanes          |
| competing_total | INTEGER        | Total vehicles in competing/cross traffic|
| seconds_elapsed | DECIMAL(10,2)  | Time elapsed in current state (seconds)  |
| decided_state   | VARCHAR(50)    | The state decided/computed for snapshot  |
| timestamp       | TIMESTAMP      | Snapshot timestamp                       |

## Usage

### SQLite (Development/Testing)

```bash
# Create database and schema
sqlite3 traffic_light.db < schema.sql

# Or run migrations
sqlite3 traffic_light.db < migrations/001_initial_schema.sql
sqlite3 traffic_light.db < migrations/002_seed_data.sql
```

### PostgreSQL (Production)

```bash
# Create database
createdb traffic_light

# Run schema
psql traffic_light < schema_postgres.sql

# Or run migrations
psql traffic_light < migrations/001_initial_schema.sql
psql traffic_light < migrations/002_seed_data.sql
```

## Example Queries

### Get all valid transitions from RED state:
```sql
SELECT 
    t.id,
    s1.name AS from_state,
    s2.name AS to_state,
    t.event_name,
    t.condition
FROM transitions t
JOIN states s1 ON t.from_state_id = s1.id
JOIN states s2 ON t.to_state_id = s2.id
WHERE s1.name = 'RED' OR s1.name = '*';
```

### Get recent sensor snapshots with state names:
```sql
SELECT 
    ss.id,
    s.name AS state_name,
    ss.waiting_vehicles,
    ss.competing_total,
    ss.seconds_elapsed,
    ss.decided_state,
    ss.timestamp
FROM sensor_snapshots ss
JOIN states s ON ss.state_id = s.id
ORDER BY ss.timestamp DESC
LIMIT 100;
```

### Insert a sensor snapshot:
```sql
INSERT INTO sensor_snapshots (state_id, waiting_vehicles, competing_total, seconds_elapsed, decided_state)
VALUES (
    (SELECT id FROM states WHERE name = 'RED'),
    5,
    2,
    30.5,
    'GREEN'
);
```

### Get transition statistics:
```sql
SELECT 
    s1.name AS from_state,
    s2.name AS to_state,
    COUNT(*) AS transition_count
FROM sensor_snapshots ss
JOIN states s1 ON ss.state_id = s1.id
JOIN states s2 ON ss.decided_state = s2.name
GROUP BY s1.name, s2.name
ORDER BY transition_count DESC;
```

## Schema Design Notes

1. **Foreign Keys:** All foreign keys use `ON DELETE CASCADE` to maintain referential integrity.

2. **Indexes:** 
   - States indexed by name for fast lookups
   - Transitions indexed by from_state, to_state, and event_name
   - Sensor snapshots indexed by state, timestamp, and decided_state for time-series queries

3. **Wildcard Transitions:** The wildcard state (id=0, name='*') is used to represent transitions that can occur from any state (e.g., EMERGENCY_OVERRIDE).

4. **Decimal Precision:** `seconds_elapsed` uses DECIMAL(10,2) to allow sub-second precision if needed.

5. **Truth Table:** The `sensor_snapshots` table serves as a truth table, recording all sensor inputs and the corresponding decisions made, enabling analysis and ML training.

