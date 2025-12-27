-- Migration 001: Initial Schema
-- Creates states, transitions, and sensor_snapshots tables

-- ============================================================================
-- STATES TABLE
-- ============================================================================
CREATE TABLE states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_states_name ON states(name);

-- ============================================================================
-- TRANSITIONS TABLE
-- ============================================================================
CREATE TABLE transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_state_id INTEGER NOT NULL,
    to_state_id INTEGER NOT NULL,
    condition TEXT,
    event_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_state_id) REFERENCES states(id) ON DELETE CASCADE,
    FOREIGN KEY (to_state_id) REFERENCES states(id) ON DELETE CASCADE,
    UNIQUE(from_state_id, to_state_id, event_name)
);

CREATE INDEX idx_transitions_from_state ON transitions(from_state_id);
CREATE INDEX idx_transitions_to_state ON transitions(to_state_id);
CREATE INDEX idx_transitions_event ON transitions(event_name);

-- ============================================================================
-- SENSOR_SNAPSHOTS TABLE
-- ============================================================================
CREATE TABLE sensor_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state_id INTEGER NOT NULL,
    waiting_vehicles INTEGER DEFAULT 0,
    competing_total INTEGER DEFAULT 0,
    seconds_elapsed DECIMAL(10, 2) NOT NULL,
    decided_state VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
);

CREATE INDEX idx_sensor_snapshots_state ON sensor_snapshots(state_id);
CREATE INDEX idx_sensor_snapshots_timestamp ON sensor_snapshots(timestamp);
CREATE INDEX idx_sensor_snapshots_decided_state ON sensor_snapshots(decided_state);
CREATE INDEX idx_sensor_snapshots_state_timestamp ON sensor_snapshots(state_id, timestamp DESC);

