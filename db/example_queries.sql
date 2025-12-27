-- Example Queries for Traffic Light FSM Database

-- ============================================================================
-- Query 1: Get all transitions from a specific state
-- ============================================================================
SELECT 
    t.id,
    s1.name AS from_state,
    s2.name AS to_state,
    t.event_name,
    t.condition
FROM transitions t
JOIN states s1 ON t.from_state_id = s1.id
JOIN states s2 ON t.to_state_id = s2.id
WHERE s1.name = 'RED' OR s1.name = '*'
ORDER BY s2.name;

-- ============================================================================
-- Query 2: Get recent sensor snapshots with full state information
-- ============================================================================
SELECT 
    ss.id,
    s.name AS current_state,
    ss.waiting_vehicles,
    ss.competing_total,
    ss.seconds_elapsed,
    ss.decided_state,
    ss.timestamp
FROM sensor_snapshots ss
JOIN states s ON ss.state_id = s.id
ORDER BY ss.timestamp DESC
LIMIT 50;

-- ============================================================================
-- Query 3: Find transitions that occurred most frequently
-- ============================================================================
SELECT 
    s1.name AS from_state,
    s2.name AS to_state,
    COUNT(*) AS transition_count,
    AVG(ss.seconds_elapsed) AS avg_seconds_before_transition,
    AVG(ss.waiting_vehicles) AS avg_waiting_vehicles,
    AVG(ss.competing_total) AS avg_competing_traffic
FROM sensor_snapshots ss
JOIN states s1 ON ss.state_id = s1.id
JOIN states s2 ON ss.decided_state = s2.name
WHERE ss.decided_state IS NOT NULL
GROUP BY s1.name, s2.name
ORDER BY transition_count DESC;

-- ============================================================================
-- Query 4: Analyze sensor data for a specific state
-- ============================================================================
SELECT 
    COUNT(*) AS snapshot_count,
    AVG(waiting_vehicles) AS avg_waiting,
    AVG(competing_total) AS avg_competing,
    AVG(seconds_elapsed) AS avg_elapsed_time,
    MIN(seconds_elapsed) AS min_elapsed,
    MAX(seconds_elapsed) AS max_elapsed
FROM sensor_snapshots
WHERE state_id = (SELECT id FROM states WHERE name = 'RED')
  AND timestamp >= datetime('now', '-24 hours');

-- ============================================================================
-- Query 5: Get transition truth table (all possible from/to combinations)
-- ============================================================================
SELECT 
    s1.name AS from_state,
    s2.name AS to_state,
    t.event_name,
    t.condition,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM sensor_snapshots ss
            WHERE ss.state_id = s1.id 
              AND ss.decided_state = s2.name
        ) THEN 'EXECUTED'
        ELSE 'POSSIBLE'
    END AS status
FROM states s1
CROSS JOIN states s2
LEFT JOIN transitions t ON t.from_state_id = s1.id AND t.to_state_id = s2.id
WHERE s1.name != '*' AND s2.name != '*'
ORDER BY s1.name, s2.name;

-- ============================================================================
-- Query 6: Find patterns in decision-making (priority analysis)
-- ============================================================================
SELECT 
    CASE 
        WHEN waiting_vehicles >= 3 AND competing_total <= 2 THEN 'HIGH_PRIORITY'
        WHEN waiting_vehicles >= 3 AND competing_total > 2 THEN 'MEDIUM_PRIORITY'
        ELSE 'LOW_PRIORITY'
    END AS priority_level,
    COUNT(*) AS count,
    AVG(seconds_elapsed) AS avg_seconds,
    GROUP_CONCAT(DISTINCT decided_state) AS decisions_made
FROM sensor_snapshots
WHERE decided_state IS NOT NULL
GROUP BY priority_level
ORDER BY count DESC;

-- ============================================================================
-- Query 7: Get sensor snapshots that resulted in state changes
-- ============================================================================
SELECT 
    ss.id,
    s.name AS from_state,
    ss.decided_state AS to_state,
    ss.waiting_vehicles,
    ss.competing_total,
    ss.seconds_elapsed,
    ss.timestamp
FROM sensor_snapshots ss
JOIN states s ON ss.state_id = s.id
WHERE ss.decided_state IS NOT NULL
  AND ss.decided_state != s.name  -- Only actual transitions
ORDER BY ss.timestamp DESC;

-- ============================================================================
-- Query 8: Validate transitions against defined schema
-- ============================================================================
SELECT 
    s1.name AS from_state,
    ss.decided_state AS to_state,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM transitions t
            WHERE t.from_state_id = s1.id
              AND t.to_state_id = (SELECT id FROM states WHERE name = ss.decided_state)
        ) OR EXISTS (
            SELECT 1 FROM transitions t
            WHERE t.from_state_id = 0  -- Wildcard
              AND t.to_state_id = (SELECT id FROM states WHERE name = ss.decided_state)
        ) THEN 'VALID'
        ELSE 'INVALID'
    END AS validation_status
FROM sensor_snapshots ss
JOIN states s1 ON ss.state_id = s1.id
WHERE ss.decided_state IS NOT NULL
GROUP BY s1.name, ss.decided_state;

