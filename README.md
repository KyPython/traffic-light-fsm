# Traffic Light Finite State Machine (FSM)

A TypeScript implementation of a reusable **Finite State Machine (FSM)** engine using the **State Design Pattern** for controlling a traffic light system.

## 🏗️ Architecture

This implementation follows **Clean Code Principles**:

- **Single Responsibility Principle (SRP)**: Each concrete state (Red, Green, Yellow) is its own class
- **Error Handling**: Robust checks for states not found or FSM not started
- **Separation of Concerns**: Generic FSM engine separated from time-based/side-effect logic

## 📁 Project Structure

```
src/
├── fsm/
│   ├── StateMachine.ts      # Core FSM engine with interfaces
│   ├── BaseState.ts         # Abstract base state class
│   ├── TrafficLightStates.ts # Concrete Red/Green/Yellow states
│   └── index.ts             # FSM exports
├── TrafficLightController.ts # High-level controller
├── demo.ts                  # Demonstration and tests
└── index.ts                 # Main entry point
```

## 🔧 Core Components

### 1. StateMachine Class (Core FSM Engine)

The generic, reusable FSM engine that manages states and transitions:

- `addState(state: State)` - Register states
- `addTransition(transition: Transition)` - Define transitions with optional guards/actions
- `start(stateName: string)` - Start FSM in initial state
- `trigger(event: Event)` - Process events and trigger transitions
- `update(deltaTime: number)` - Update current state (for time-based logic)
- `getCurrentState()` - Get current state name
- `getHistory()` - Get state transition history
- `canTransition(event: Event)` - Check if event can trigger transition

### 2. State Interface & BaseState

```typescript
interface State {
  name: string;
  onEnter?(): void;      // Called when entering state
  onExit?(): void;       // Called when exiting state  
  onUpdate?(deltaTime: number): void; // For time-based logic
}
```

### 3. Traffic Light States

**RedLightState** (30 seconds)
- Manages 30-second timer
- Triggers `TIMER_EXPIRED` event when complete

**GreenLightState** (25 seconds)  
- Manages 25-second timer
- Triggers `TIMER_EXPIRED` event when complete

**YellowLightState** (5 seconds)
- Manages 5-second timer  
- Triggers `TIMER_EXPIRED` event when complete

### 4. Transition Configuration

```typescript
const transitions: Transition[] = [
  { from: 'RED', to: 'GREEN', event: 'TIMER_EXPIRED' },
  { from: 'GREEN', to: 'YELLOW', event: 'TIMER_EXPIRED' },
  { from: 'YELLOW', to: 'RED', event: 'TIMER_EXPIRED' },
  
  // Emergency override - can transition from any state to RED
  { from: '*', to: 'RED', event: 'EMERGENCY_OVERRIDE' },
  
  // Manual overrides for testing/maintenance
  { from: '*', to: 'GREEN', event: 'FORCE_GREEN' },
  { from: '*', to: 'YELLOW', event: 'FORCE_YELLOW' },
  { from: '*', to: 'RED', event: 'FORCE_RED' }
];
```

## 🚀 Usage

### Basic Usage

```typescript
import { TrafficLightController } from './TrafficLightController';

const controller = new TrafficLightController(true); // Enable debug mode

// Start the traffic light (begins in RED state for safety)
controller.start();

// In your main loop
function gameLoop() {
  const deltaTime = 16; // 16ms (60 FPS)
  controller.update(deltaTime);
  requestAnimationFrame(gameLoop);
}

gameLoop();
```

### Manual Controls

```typescript
// Emergency situations
controller.emergencyOverride(); // Force to RED immediately

// Manual overrides for testing
controller.forceGreen();
controller.forceYellow();
controller.forceRed();

// Status checking
console.log(controller.getCurrentState()); // 'RED', 'GREEN', or 'YELLOW'
console.log(controller.getHistory());      // ['RED', 'GREEN', 'YELLOW', ...]
console.log(controller.canTransition('EMERGENCY_OVERRIDE')); // true/false
```

### Advanced FSM Usage

```typescript
import { StateMachine, State, Transition } from './fsm';

// Create custom states
class CustomState implements State {
  name = 'CUSTOM';
  
  onEnter() {
    console.log('Entered custom state');
  }
  
  onUpdate(deltaTime: number) {
    // Custom time-based logic
  }
}

// Create and configure FSM
const fsm = new StateMachine(true);
fsm.addState(new CustomState());
fsm.addTransition({ from: 'INITIAL', to: 'CUSTOM', event: 'START' });
fsm.start('INITIAL');
fsm.trigger('START');
```

## 🧪 Testing & Demo

### Run the Demo

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run the interactive demo
node dist/demo.js
```

### Structure Validation

```bash
# Quick structure check (no compilation needed)
node test.js
```

The demo includes:
- ✅ Complete traffic light cycle simulation
- ✅ Emergency override demonstration  
- ✅ Unit tests for error handling
- ✅ Manual control testing
- ✅ State history tracking

## 🎯 Key Features

### 1. **Robust Error Handling**
- States not found validation
- FSM not started checks  
- Double start prevention
- Invalid transition handling

### 2. **Flexible Transition System**
- Global transitions (using `'*'` as from state)
- Guard conditions for conditional transitions
- Action callbacks for side effects
- Event-driven state changes

### 3. **Time-Based State Logic**
- Delta time updates for smooth timing
- Individual state timer management
- Automatic event triggering on timeout

### 4. **Debugging & Monitoring**
- Optional debug logging
- State transition history
- Transition capability checking
- Current state inspection

## 🔄 State Flow Diagram

```
    START
      ↓
   [RED 30s] ──TIMER_EXPIRED──→ [GREEN 25s] ──TIMER_EXPIRED──→ [YELLOW 5s]
      ↑                                                              │
      └────────────────────TIMER_EXPIRED────────────────────────────┘
      
   EMERGENCY_OVERRIDE (from any state) → [RED]
```

## 🎨 Design Patterns Used

1. **State Pattern** - Each state is encapsulated in its own class
2. **Strategy Pattern** - States can be swapped without changing the FSM engine  
3. **Observer Pattern** - States trigger events to notify the FSM
4. **Template Method** - BaseState provides common structure with abstract methods

## 🚧 Extension Points

The FSM is designed to be easily extensible:

- **Add new states**: Extend `BaseState` and implement `onUpdate()`
- **Add new events**: Simply reference them in transitions  
- **Add guards**: Use `guard` functions in transitions for conditional logic
- **Add actions**: Use `action` callbacks for side effects during transitions
- **Multiple FSMs**: Create multiple StateMachine instances for complex systems

## 🚀 Live Demo

Experience the interactive traffic light FSM demo:

**🌐 [Live Demo](https://traffic-fsm-demo.vercel.app)** - Interactive web demonstration

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build TypeScript
npm run build

# Run CLI demo
npm test
```

### Deployment

This project is configured for automatic deployment to Vercel:
- **Repository**: [GitHub - traffic-light-fsm](https://github.com/KyPython/traffic-light-fsm)
- **Live Demo**: [Vercel Deployment](https://traffic-fsm-demo.vercel.app)

## 📋 Requirements Met

✅ **Structured Implementation** - Clean interfaces and separation of concerns  
✅ **Technical Constraints** - TypeScript with proper typing throughout  
✅ **State Design Pattern** - Each state is its own class following SRP  
✅ **Reusable FSM Engine** - Generic StateMachine class for any state system  
✅ **Error Handling** - Comprehensive validation and error checking  
✅ **Clean Boundaries** - Core engine separated from application-specific logic