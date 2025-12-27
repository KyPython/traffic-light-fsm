-- Migration 002: Seed Initial Data
-- Inserts default states and transitions

-- Insert default states
INSERT INTO states (id, name) VALUES
    (1, 'RED'),
    (2, 'GREEN'),
    (3, 'YELLOW');

-- Insert wildcard state for global transitions
INSERT INTO states (id, name) VALUES (0, '*');

-- Insert default transitions (from TrafficLightController.ts)
-- RED -> GREEN (on TIMER_EXPIRED)
INSERT INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (1, 2, 'TIMER_EXPIRED', 'Timer duration >= 30 seconds');

-- GREEN -> YELLOW (on TIMER_EXPIRED)
INSERT INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (2, 3, 'TIMER_EXPIRED', 'Timer duration >= 25 seconds');

-- YELLOW -> RED (on TIMER_EXPIRED)
INSERT INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (3, 1, 'TIMER_EXPIRED', 'Timer duration >= 5 seconds');

-- Emergency override: any state -> RED
INSERT INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (0, 1, 'EMERGENCY_OVERRIDE', 'Emergency vehicle detected - force to RED');

-- Manual overrides (from any state)
INSERT INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (0, 2, 'FORCE_GREEN', 'Manual override - force to GREEN');

INSERT INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (0, 3, 'FORCE_YELLOW', 'Manual override - force to YELLOW');

INSERT INTO transitions (from_state_id, to_state_id, event_name, condition)
VALUES (0, 1, 'FORCE_RED', 'Manual override - force to RED');

