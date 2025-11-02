# Copilot Instructions for Traffic Light FSM

## Architecture Overview

This is a **TypeScript Finite State Machine (FSM) implementation** using the **State Design Pattern**. The core architecture separates the generic FSM engine from the traffic light domain logic:

- **`src/fsm/StateMachine.ts`** - Generic, reusable FSM engine with interfaces
- **`src/fsm/TrafficLightStates.ts`** - Concrete state implementations (Red/Green/Yellow)  
- **`src/TrafficLightController.ts`** - High-level controller that wires FSM + states
- **`public/js/main.js`** - Browser-compatible JavaScript version for web demo

## Key Design Patterns

### State Pattern Implementation
Each traffic light state is its own class extending `BaseState`:
```typescript
export class RedLightState extends BaseState {
  constructor(private fsm: StateMachine) { super('RED'); }
  onUpdate(deltaTime: number): void {
    // Timer logic triggers fsm.trigger('TIMER_EXPIRED')
  }
}
```

### FSM Engine Core Methods
- `addState(state)` / `addTransition(transition)` - Setup phase
- `start(initialState)` - Must be called before triggering events  
- `trigger(event)` - Process events, execute transitions with guards/actions
- `update(deltaTime)` - Call state's time-based logic (drives timer expiration)

### Transition Configuration Pattern
Global transitions using `'*'` as `from` state for emergency overrides:
```typescript
{ from: '*', to: 'RED', event: 'EMERGENCY_OVERRIDE' }
```

## Development Workflow

### Build Commands
- `npm run build` - Compile TypeScript to `dist/`
- `npm run dev` - Watch mode compilation
- `npm test` - Run the demo (requires build first)
- `npm start` - Serve web demo at localhost

### Testing Pattern  
The `demo.ts` file contains comprehensive testing including:
- Complete traffic light cycle simulation
- Emergency override scenarios
- Error handling validation
- Manual state forcing

### Deployment
- **Vercel**: Static site deployment configured for `public/` directory
- **GitHub Pages**: Compatible - serves from `public/js/main.js`

## Code Conventions

### State Lifecycle
All states follow this lifecycle pattern:
1. `onEnter()` - Initialize timers, log state entry
2. `onUpdate(deltaTime)` - Increment timers, trigger events when expired  
3. `onExit()` - Cleanup (inherited from BaseState)

### Error Handling Strategy
The FSM has robust validation:
- States must exist before adding transitions
- FSM must be started before triggering events
- Double-start prevention with clear error messages

### Debug Logging
Enable debug mode in constructor: `new StateMachine(true)` logs all transitions and events.

### Timer Implementation
States use millisecond precision with delta time updates:
```typescript
private timer: number = 0;
private readonly duration: number = 30000; // 30 seconds

onUpdate(deltaTime: number): void {
  this.timer += deltaTime;
  if (this.timer >= this.duration) {
    this.fsm.trigger('TIMER_EXPIRED');
  }
}
```

## Extension Points

### Adding New States
1. Extend `BaseState` with unique name
2. Implement `onUpdate()` for time-based logic
3. Add to `TrafficLightController.setupStatesAndTransitions()`

### Adding New Events
Simply reference new event strings in transition definitions - no registration needed.

### Cross-Platform Considerations
- **Node.js**: Uses TypeScript source in `src/`
- **Browser**: Uses transpiled JavaScript in `public/js/main.js`  
- Keep both versions synchronized when adding features

## Critical Dependencies

- **No runtime dependencies** - Pure TypeScript/JavaScript implementation
- **Dev dependencies**: TypeScript compiler, Node.js types
- **Browser compatibility**: ES2020+ features (classes, Map, destructuring)