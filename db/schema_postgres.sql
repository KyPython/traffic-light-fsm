-- Session 6 - Database Schema for Traffic Light FSM (PostgreSQL)
-- Tables: states, transitions, sensor_snapshots

-- ============================================================================
-- STATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
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
    id SERIAL PRIMARY KEY,
    from_state_id INTEGER NOT NULL,
    to_state_id INTEGER NOT NULL,
    condition TEXT,  -- JSON or text description of transition condition
    event_name VARCHAR(100),  -- Event that triggers this transition (e.g., "TIMER_EXPIRED")
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
    id SERIAL PRIMARY KEY,
    state_id INTEGER NOT NULL,
    waiting_vehicles INTEGER DEFAULT 0,  -- Vehicles waiting in local lanes
    competing_total INTEGER DEFAULT 0,   -- Total vehicles in competing/cross traffic
    seconds_elapsed DECIMAL(10, 2) NOT NULL,  -- Time elapsed in current state (seconds)
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
INSERT INTO states (id, name) VALUES
    (1, 'RED'),
    (2, 'GREEN'),
    (3, 'YELLOW')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INITIAL DATA: Insert default transitions (from TrafficLightController.ts)
-- ============================================================================
-- RED -> GREEN (on TIMER_EXPIRED)
INSERT INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (1, 2, 'TIMER_EXPIRED', 'Timer duration >= 30 seconds')
ON CONFLICT (from_state_id, to_state_id, event_name) DO NOTHING;

-- GREEN -> YELLOW (on TIMER_EXPIRED)
INSERT INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (2, 3, 'TIMER_EXPIRED', 'Timer duration >= 25 seconds')
ON CONFLICT (from_state_id, to_state_id, event_name) DO NOTHING;

-- YELLOW -> RED (on TIMER_EXPIRED)
INSERT INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (3, 1, 'TIMER_EXPIRED', 'Timer duration >= 5 seconds')
ON CONFLICT (from_state_id, to_state_id, event_name) DO NOTHING;

-- Optional: Emergency override transitions (using NULL for wildcard '*')
-- Note: For production, you might want a separate wildcard_states table
-- For simplicity, we'll create a special state with id=0 for wildcard
INSERT INTO states (id, name) VALUES (0, '*')
ON CONFLICT (id) DO NOTHING;

INSERT INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (0, 1, 'EMERGENCY_OVERRIDE', 'Emergency vehicle detected - force to RED')
ON CONFLICT (from_state_id, to_state_id, event_name) DO NOTHING;

