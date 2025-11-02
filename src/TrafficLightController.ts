// Traffic Light Controller using the FSM engine
import { StateMachine, Transition } from './fsm/StateMachine';
import { RedLightState, GreenLightState, YellowLightState } from './fsm/TrafficLightStates';

export class TrafficLightController {
  private fsm: StateMachine;
  private redState: RedLightState;
  private greenState: GreenLightState;
  private yellowState: YellowLightState;
  private isRunning: boolean = false;

  constructor(debug: boolean = false) {
    this.fsm = new StateMachine(debug);
    
    // Create state instances
    this.redState = new RedLightState(this.fsm);
    this.greenState = new GreenLightState(this.fsm);
    this.yellowState = new YellowLightState(this.fsm);

    this.setupStatesAndTransitions();
  }

  private setupStatesAndTransitions(): void {
    // Add states to the FSM
    this.fsm.addState(this.redState);
    this.fsm.addState(this.greenState);
    this.fsm.addState(this.yellowState);

    // Define the normal traffic light cycle transitions
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

    // Add all transitions
    transitions.forEach(transition => this.fsm.addTransition(transition));
  }

  start(): void {
    if (this.isRunning) {
      throw new Error('Traffic light controller is already running');
    }

    console.log('🚦 Starting Traffic Light Controller...');
    this.fsm.start('RED'); // Always start with RED for safety
    this.isRunning = true;
  }

  stop(): void {
    console.log('🚦 Stopping Traffic Light Controller...');
    this.isRunning = false;
  }

  update(deltaTime: number): void {
    if (!this.isRunning) {
      return;
    }

    this.fsm.update(deltaTime);
  }

  // Manual control methods
  emergencyOverride(): boolean {
    if (!this.isRunning) {
      console.log('Cannot trigger emergency override: controller not running');
      return false;
    }
    
    console.log('🚨 EMERGENCY OVERRIDE ACTIVATED');
    return this.fsm.trigger('EMERGENCY_OVERRIDE');
  }

  forceGreen(): boolean {
    return this.isRunning && this.fsm.trigger('FORCE_GREEN');
  }

  forceYellow(): boolean {
    return this.isRunning && this.fsm.trigger('FORCE_YELLOW');
  }

  forceRed(): boolean {
    return this.isRunning && this.fsm.trigger('FORCE_RED');
  }

  // Status methods
  getCurrentState(): string {
    try {
      return this.fsm.getCurrentState();
    } catch (error) {
      return 'NOT_STARTED';
    }
  }

  getHistory(): string[] {
    return this.fsm.getHistory();
  }

  canTransition(event: string): boolean {
    return this.fsm.canTransition(event);
  }

  isOperational(): boolean {
    return this.isRunning;
  }
}