# Copilot Instructions for Traffic Light FSM

## Architecture Overview

This is a **TypeScript Finite State Machine (FSM) implementation** using the **State Design Pattern**, following Clean Code principles from Chapters 5-6 (Error Handling, Boundaries). The core architecture separates the generic FSM engine from the traffic light domain logic:

- **`src/fsm/StateMachine.ts`** - Generic, reusable FSM engine with interfaces, guards, and actions
- **`src/fsm/BaseState.ts`** - Abstract base class following Template Method pattern
- **`src/fsm/TrafficLightStates.ts`** - Concrete state implementations (Red/Green/Yellow)
- **`src/TrafficLightController.ts`** - High-level controller with error boundaries
- **`src/demo.ts`** - Comprehensive testing including edge cases and emergency scenarios
- **`public/js/main.js`** - Browser-compatible JavaScript version for web demo

## Learning Objectives Alignment (Week 3 Curriculum)

This codebase implements **Session 1-3** requirements from the FSM curriculum:

- ✅ Moore Machine implementation (outputs depend only on current state)
- ✅ State Pattern with enter/exit/update lifecycle
- ✅ Transition guards and actions
- ✅ Global transitions (`'*'` from state) for emergency overrides
- ✅ Comprehensive error handling and boundary validation

## Key Design Patterns

### State Pattern Implementation

Each traffic light state is its own class extending `BaseState`:

```typescript
export class RedLightState extends BaseState {
  constructor(private fsm: StateMachine) {
    super("RED");
  }
  onUpdate(deltaTime: number): void {
    // Timer logic triggers fsm.trigger('TIMER_EXPIRED')
  }
}
```

### FSM Engine Core Methods

- `addState(state)` / `addTransition(transition)` - Setup phase with validation
- `start(initialState)` - Must be called before triggering events (throws if state not found)
- `trigger(event)` - Process events, execute transitions with guards/actions
- `update(deltaTime)` - Call state's time-based logic (drives timer expiration)
- `canTransition(event)` - Check transition validity without executing

### Advanced Transition Patterns

1. **Global Transitions** - Emergency overrides from any state:

```typescript
{ from: '*', to: 'RED', event: 'EMERGENCY_OVERRIDE' }
```

2. **Guarded Transitions** - Conditional logic:

```typescript
{
  from: 'GREEN', to: 'YELLOW', event: 'TIMER_EXPIRED',
  guard: () => !isPedestrianWaiting(),
  action: () => logTransition('GREEN', 'YELLOW')
}
```

3. **Transition Actions** - Side effects during state changes:

```typescript
action: () => console.log("🚨 Emergency vehicle priority!");
```

## Development Workflow

### Build Commands

- `npm run build` - Compile TypeScript to `dist/`
- `npm run dev` - Watch mode compilation
- `npm test` - Run the demo (requires build first)
- `npm start` - Serve web demo at localhost

### Testing Pattern

The `demo.ts` file contains comprehensive testing including:

- **Complete Cycle Simulation** - 70-second simulation showing full RED→GREEN→YELLOW cycles
- **Emergency Override Scenarios** - Demonstrates global transitions at runtime
- **Error Handling Validation** - Tests double-start prevention and invalid operations
- **Manual State Forcing** - Tests forceGreen/Yellow/Red methods
- **Boundary Testing** - Validates FSM behavior at initialization and state transitions

### Deployment

- **Vercel**: Static site deployment configured for `public/` directory
- **GitHub Pages**: Compatible - serves from `public/js/main.js`

## Code Conventions

### State Lifecycle

All states follow this lifecycle pattern:

1. `onEnter()` - Initialize timers, log state entry
2. `onUpdate(deltaTime)` - Increment timers, trigger events when expired
3. `onExit()` - Cleanup (inherited from BaseState)

### Error Handling Strategy (Clean Code Ch. 5-6)

The FSM implements comprehensive boundary validation:

- **State Validation**: States must exist before adding transitions
- **Lifecycle Checks**: FSM must be started before triggering events
- **Double-start Prevention**: Clear error messages for invalid operations
- **Graceful Degradation**: Controller methods return false rather than throwing for user errors

Example error handling pattern:

```typescript
getCurrentState(): string {
  try {
    return this.fsm.getCurrentState();
  } catch (error) {
    return 'NOT_STARTED'; // Graceful fallback
  }
}
```

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

## Curriculum Extensions Ready

The codebase is structured to support Week 3 Session 4-6 additions:

- **4-Way Intersection**: Extend `TrafficLightController` to manage coordinated FSMs
- **Pedestrian Crossing**: Add `WALK`/`DONT_WALK` states with button events
- **Hierarchical States**: FSM engine supports nested state machines
- **Monitoring Dashboard**: History tracking and metrics collection built-in

## Critical Dependencies

- **No runtime dependencies** - Pure TypeScript/JavaScript implementation
- **Dev dependencies**: TypeScript compiler, Node.js types
- **Browser compatibility**: ES2020+ features (classes, Map, destructuring)
