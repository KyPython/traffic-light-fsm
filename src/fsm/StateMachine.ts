// State interface
export interface State {
  name: string;
  onEnter?: () => void;
  onExit?: () => void;
  onUpdate?: (deltaTime: number) => void; // For time-based state logic
}

// Event type
export type Event = string;

// Transition with guard and action
export interface Transition {
  from: string | '*'; // '*' for global transitions (e.g., Emergency Override)
  to: string;
  event: Event;
  guard?: () => boolean; // Optional condition check
  action?: () => void;    // Side effect on transition
}

// Main FSM Engine
export class StateMachine {
  private currentState: State | null = null;
  private states: Map<string, State> = new Map();
  private transitions: Transition[] = [];
  private history: string[] = [];

  constructor(private debug: boolean = false) {}

  addState(state: State): void {
    if (this.states.has(state.name)) {
      throw new Error(`State '${state.name}' already exists`);
    }
    this.states.set(state.name, state);
    this.log(`Added state: ${state.name}`);
  }

  addTransition(transition: Transition): void {
    // Validate that states exist (unless it's a global transition)
    if (transition.from !== '*' && !this.states.has(transition.from)) {
      throw new Error(`Source state '${transition.from}' does not exist`);
    }
    if (!this.states.has(transition.to)) {
      throw new Error(`Target state '${transition.to}' does not exist`);
    }
    
    this.transitions.push(transition);
    this.log(`Added transition: ${transition.from} --[${transition.event}]--> ${transition.to}`);
  }

  start(stateName: string): void {
    const state = this.states.get(stateName);
    if (!state) {
      throw new Error(`Cannot start FSM: State '${stateName}' not found`);
    }

    if (this.currentState) {
      throw new Error('FSM is already started. Use trigger() to change states.');
    }

    this.currentState = state;
    this.history.push(stateName);
    this.log(`FSM started in state: ${stateName}`);
    
    // Call onEnter if it exists
    if (state.onEnter) {
      state.onEnter();
    }
  }

  trigger(event: Event): boolean {
    if (!this.currentState) {
      throw new Error('FSM not started. Call start() first.');
    }

    const currentStateName = this.currentState.name;
    this.log(`Triggering event '${event}' from state '${currentStateName}'`);

    // Find matching transition (check specific state first, then global transitions)
    const transition = this.transitions.find(t => 
      (t.from === currentStateName || t.from === '*') && 
      t.event === event &&
      (!t.guard || t.guard())
    );

    if (!transition) {
      this.log(`No valid transition found for event '${event}' from state '${currentStateName}'`);
      return false;
    }

    // Execute the transition
    this.transitionTo(transition.to, transition.action);
    return true;
  }

  private transitionTo(stateName: string, action?: () => void): void {
    const newState = this.states.get(stateName);
    if (!newState) {
      throw new Error(`Target state '${stateName}' not found`);
    }

    const oldStateName = this.currentState?.name;
    this.log(`Transitioning from '${oldStateName}' to '${stateName}'`);

    // Call onExit on current state
    if (this.currentState && this.currentState.onExit) {
      this.currentState.onExit();
    }

    // Execute transition action if provided
    if (action) {
      action();
    }

    // Change state
    this.currentState = newState;
    this.history.push(stateName);

    // Call onEnter on new state
    if (newState.onEnter) {
      newState.onEnter();
    }
  }

  update(deltaTime: number): void {
    if (!this.currentState) {
      throw new Error('FSM not started. Call start() first.');
    }

    // Call onUpdate on current state if it exists
    if (this.currentState.onUpdate) {
      this.currentState.onUpdate(deltaTime);
    }
  }

  getCurrentState(): string {
    if (!this.currentState) {
      throw new Error('FSM not started. Call start() first.');
    }
    return this.currentState.name;
  }

  getHistory(): string[] {
    return [...this.history]; // Return a copy to prevent external modification
  }

  canTransition(event: Event): boolean {
    if (!this.currentState) {
      return false;
    }

    const currentStateName = this.currentState.name;
    
    // Check if there's a valid transition for this event
    const transition = this.transitions.find(t => 
      (t.from === currentStateName || t.from === '*') && 
      t.event === event &&
      (!t.guard || t.guard())
    );

    return transition !== undefined;
  }

  private log(message: string): void {
    if (this.debug) {
      console.log(`[FSM] ${message}`);
    }
  }
}