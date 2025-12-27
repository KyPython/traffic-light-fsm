/**
 * Session 5 - REST API for /next-state
 * POST /next-state endpoint that takes currentState, waitingVehicles, competingTraffic, secondsElapsed
 * and responds with nextState using the same logic as the TypeScript controller
 * 
 * Integrated with:
 * - Session 4: Priority logic (isLocalLanePriority)
 * - Session 6: Database storage (sensor_snapshots)
 */
import express, { Request, Response } from 'express';
import { Database } from './db';
import { isLocalLanePriority } from './priority';

const app = express();
app.disable('x-powered-by'); // Security: disable X-Powered-By header
app.use(express.json());

// Initialize database
const db = new Database();
const DB_PATH = process.env.DB_PATH || './traffic_light.db';

// Initialize database on startup
db.initialize(DB_PATH).catch((err) => {
  console.error('Failed to initialize database:', err);
  console.log('API will continue without database persistence');
});

// State durations in seconds (matching TrafficLightStates.ts)
const STATE_DURATIONS = {
  RED: 30,    // 30000ms = 30 seconds
  GREEN: 25,  // 25000ms = 25 seconds
  YELLOW: 5   // 5000ms = 5 seconds
};

// State transition mapping (based on TrafficLightController.ts setupStatesAndTransitions)
const STATE_TRANSITIONS: Record<string, string> = {
  RED: 'GREEN',
  GREEN: 'YELLOW',
  YELLOW: 'RED'
};

interface NextStateRequest {
  currentState: 'RED' | 'GREEN' | 'YELLOW';
  waitingVehicles?: number;      // Optional: vehicles waiting in local lanes
  competingTraffic?: number;     // Optional: vehicles in competing/cross traffic
  secondsElapsed: number;        // Required: time elapsed in current state (seconds)
}

interface NextStateResponse {
  nextState: 'RED' | 'GREEN' | 'YELLOW';
  transitioned: boolean;
  reason: string;
}

/**
 * Determine next state based on current state and elapsed time
 * Matches the logic from TrafficLightController and TrafficLightStates
 */
function computeNextState(
  currentState: 'RED' | 'GREEN' | 'YELLOW',
  secondsElapsed: number,
  waitingVehicles?: number,
  competingTraffic?: number
): NextStateResponse {
  const duration = STATE_DURATIONS[currentState];
  
  // Check if timer has expired (allowing some tolerance for float precision)
  const timerExpired = secondsElapsed >= duration;
  
  if (!timerExpired) {
    return {
      nextState: currentState,
      transitioned: false,
      reason: `Timer not expired: ${secondsElapsed}s < ${duration}s`
    };
  }
  
  // Timer expired - transition to next state in cycle
  const nextState = STATE_TRANSITIONS[currentState] as 'RED' | 'GREEN' | 'YELLOW';
  
  // Use priority logic from Session 4 (integrated TypeScript version)
  let reason = `Timer expired: ${secondsElapsed}s >= ${duration}s. Normal cycle transition.`;
  let priorityNote = '';
  
  if (waitingVehicles !== undefined && competingTraffic !== undefined) {
    const priority = isLocalLanePriority(waitingVehicles, competingTraffic);
    if (priority.shouldSwitch) {
      priorityNote = ` [Priority: ${priority.reason}]`;
    } else {
      priorityNote = ` [Priority check: ${priority.reason}]`;
    }
  }
  
  reason += priorityNote;
  
  return {
    nextState,
    transitioned: true,
    reason
  };
}

/**
 * POST /next-state
 * Determines the next state for a traffic light controller
 */
app.post('/next-state', (req: Request, res: Response) => {
  try {
    const { currentState, waitingVehicles, competingTraffic, secondsElapsed } = req.body as NextStateRequest;
    
    // Validate required fields
    if (!currentState) {
      return res.status(400).json({ 
        error: 'Missing required field: currentState' 
      });
    }
    
    if (typeof secondsElapsed !== 'number') {
      return res.status(400).json({ 
        error: 'Missing or invalid required field: secondsElapsed (must be a number)' 
      });
    }
    
    // Validate currentState is valid
    if (!['RED', 'GREEN', 'YELLOW'].includes(currentState)) {
      return res.status(400).json({ 
        error: `Invalid currentState: ${currentState}. Must be RED, GREEN, or YELLOW` 
      });
    }
    
    // Validate optional numeric fields
    if (waitingVehicles !== undefined && (typeof waitingVehicles !== 'number' || waitingVehicles < 0)) {
      return res.status(400).json({ 
        error: 'waitingVehicles must be a non-negative number' 
      });
    }
    
    if (competingTraffic !== undefined && (typeof competingTraffic !== 'number' || competingTraffic < 0)) {
      return res.status(400).json({ 
        error: 'competingTraffic must be a non-negative number' 
      });
    }
    
    if (secondsElapsed < 0) {
      return res.status(400).json({ 
        error: 'secondsElapsed must be non-negative' 
      });
    }
    
    // Compute next state
    const result = computeNextState(
      currentState,
      secondsElapsed,
      waitingVehicles,
      competingTraffic
    );
    
    // Save snapshot to database (async, don't block response)
    db.getStateId(currentState).then((stateId) => {
      if (stateId !== null) {
        return db.saveSensorSnapshot({
          stateId,
          waitingVehicles: waitingVehicles ?? 0,
          competingTotal: competingTraffic ?? 0,
          secondsElapsed,
          decidedState: result.nextState
        });
      }
    }).catch((err) => {
      console.error('Failed to save sensor snapshot:', err);
      // Don't fail the request if DB save fails
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Error processing /next-state:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'traffic-light-fsm-api' });
});

/**
 * GET /states
 * Returns available states and their durations
 */
app.get('/states', (req: Request, res: Response) => {
  res.json({
    states: Object.keys(STATE_DURATIONS),
    durations: STATE_DURATIONS,
    transitions: STATE_TRANSITIONS
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚦 Traffic Light FSM API server running on port ${PORT}`);
  console.log(`   POST /next-state - Compute next state`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /states - Available states and transitions`);
});

export default app;

