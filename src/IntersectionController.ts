// 4-Way Intersection Controller with coordinated traffic lights
import { StateMachine, Transition } from './fsm/StateMachine';
import { RedLightState, GreenLightState, YellowLightState } from './fsm/TrafficLightStates';

export class IntersectionController {
  private northSouth: StateMachine;
  private eastWest: StateMachine;
  private pedestrianWaiting: { NS: boolean; EW: boolean } = { NS: false, EW: false };
  private isRunning: boolean = false;

  // State references for coordination
  private nsRedState: RedLightState;
  private nsGreenState: GreenLightState;
  private nsYellowState: YellowLightState;
  private ewRedState: RedLightState;
  private ewGreenState: GreenLightState;
  private ewYellowState: YellowLightState;

  constructor(debug: boolean = false) {
    this.northSouth = new StateMachine(debug);
    this.eastWest = new StateMachine(debug);

    this.setupTrafficLights();
    this.setupCoordination();
  }

  private setupTrafficLights(): void {
    // Create North-South traffic light states
    this.nsRedState = new RedLightState(this.northSouth);
    this.nsGreenState = new GreenLightState(this.northSouth);
    this.nsYellowState = new YellowLightState(this.northSouth);

    this.northSouth.addState(this.nsRedState);
    this.northSouth.addState(this.nsGreenState);
    this.northSouth.addState(this.nsYellowState);

    // Create East-West traffic light states
    this.ewRedState = new RedLightState(this.eastWest);
    this.ewGreenState = new GreenLightState(this.eastWest);
    this.ewYellowState = new YellowLightState(this.eastWest);

    this.eastWest.addState(this.ewRedState);
    this.eastWest.addState(this.ewGreenState);
    this.eastWest.addState(this.ewYellowState);

    // Add transitions for North-South
    const nsTransitions: Transition[] = [
      {
        from: 'RED',
        to: 'GREEN',
        event: 'TIMER_EXPIRED',
        guard: () => this.canNSGoGreen(),
        action: () => console.log('🟢 NS: RED → GREEN')
      },
      {
        from: 'GREEN',
        to: 'YELLOW',
        event: 'TIMER_EXPIRED',
        action: () => console.log('🟡 NS: GREEN → YELLOW')
      },
      {
        from: 'YELLOW',
        to: 'RED',
        event: 'TIMER_EXPIRED',
        action: () => {
          console.log('🔴 NS: YELLOW → RED');
          // Trigger EW to go green after NS turns red
          setTimeout(() => {
            if (this.isRunning) {
              this.eastWest.trigger('TIMER_EXPIRED');
            }
          }, 1000); // 1 second safety delay
        }
      },
      { from: '*', to: 'RED', event: 'EMERGENCY_OVERRIDE' }
    ];

    // Add transitions for East-West
    const ewTransitions: Transition[] = [
      {
        from: 'RED',
        to: 'GREEN',
        event: 'TIMER_EXPIRED',
        guard: () => this.canEWGoGreen(),
        action: () => console.log('🟢 EW: RED → GREEN')
      },
      {
        from: 'GREEN',
        to: 'YELLOW',
        event: 'TIMER_EXPIRED',
        action: () => console.log('🟡 EW: GREEN → YELLOW')
      },
      {
        from: 'YELLOW',
        to: 'RED',
        event: 'TIMER_EXPIRED',
        action: () => {
          console.log('🔴 EW: YELLOW → RED');
          // Trigger NS to go green after EW turns red
          setTimeout(() => {
            if (this.isRunning) {
              this.northSouth.trigger('TIMER_EXPIRED');
            }
          }, 1000); // 1 second safety delay
        }
      },
      { from: '*', to: 'RED', event: 'EMERGENCY_OVERRIDE' }
    ];

    nsTransitions.forEach(t => this.northSouth.addTransition(t));
    ewTransitions.forEach(t => this.eastWest.addTransition(t));
  }

  private setupCoordination(): void {
    // Safety rule: NS and EW cannot both be green at the same time
    // This is enforced through the guard functions
  }

  private canNSGoGreen(): boolean {
    // NS can go green only if EW is RED
    try {
      const ewState = this.eastWest.getCurrentState();
      return ewState === 'RED';
    } catch {
      return true; // If EW not started, allow NS to start
    }
  }

  private canEWGoGreen(): boolean {
    // EW can go green only if NS is RED
    try {
      const nsState = this.northSouth.getCurrentState();
      return nsState === 'RED';
    } catch {
      return true; // If NS not started, allow EW to start
    }
  }

  start(): void {
    if (this.isRunning) {
      throw new Error('Intersection controller is already running');
    }

    console.log('🚦 Starting 4-Way Intersection Controller...');
    console.log('🚦 NS starts GREEN, EW starts RED for safety coordination');

    // Start with NS green and EW red for staggered operation
    this.northSouth.start('GREEN');
    this.eastWest.start('RED');

    this.isRunning = true;
  }

  stop(): void {
    console.log('🚦 Stopping Intersection Controller...');
    this.isRunning = false;
  }

  update(deltaTime: number): void {
    if (!this.isRunning) {
      return;
    }

    this.northSouth.update(deltaTime);
    this.eastWest.update(deltaTime);

    // Check and handle pedestrian crossing requests
    this.handlePedestrianRequests();
  }

  // Pedestrian crossing button pressed
  pedestrianButtonPressed(direction: 'NS' | 'EW'): void {
    if (!this.isRunning) {
      console.log('Cannot request pedestrian crossing: intersection not running');
      return;
    }

    console.log(`🚶 Pedestrian button pressed for ${direction} crossing`);

    if (direction === 'NS') {
      this.pedestrianWaiting.NS = true;
    } else {
      this.pedestrianWaiting.EW = true;
    }
  }

  private handlePedestrianRequests(): void {
    // If pedestrian waiting for NS crossing (cross during NS RED = EW GREEN)
    if (this.pedestrianWaiting.NS) {
      try {
        const nsState = this.northSouth.getCurrentState();
        if (nsState === 'RED') {
          console.log('🚶 NS pedestrian can cross (NS is RED)');
          this.pedestrianWaiting.NS = false;
          // In a real system, would activate walk signal here
        }
      } catch {
        // FSM not started, ignore
      }
    }

    // If pedestrian waiting for EW crossing (cross during EW RED = NS GREEN)
    if (this.pedestrianWaiting.EW) {
      try {
        const ewState = this.eastWest.getCurrentState();
        if (ewState === 'RED') {
          console.log('🚶 EW pedestrian can cross (EW is RED)');
          this.pedestrianWaiting.EW = false;
          // In a real system, would activate walk signal here
        }
      } catch {
        // FSM not started, ignore
      }
    }
  }

  // Emergency vehicle approaching from direction
  emergencyVehicle(direction: 'NS' | 'EW'): void {
    if (!this.isRunning) {
      console.log('Cannot trigger emergency: intersection not running');
      return;
    }

    console.log(`🚨 EMERGENCY VEHICLE approaching from ${direction}!`);

    if (direction === 'NS') {
      // Force NS to GREEN, EW to RED
      this.northSouth.trigger('EMERGENCY_OVERRIDE');
      this.northSouth.trigger('FORCE_GREEN');
      this.eastWest.trigger('EMERGENCY_OVERRIDE'); // Forces EW to RED
      console.log('🚨 NS forced to GREEN, EW forced to RED');
    } else {
      // Force EW to GREEN, NS to RED
      this.eastWest.trigger('EMERGENCY_OVERRIDE');
      this.eastWest.trigger('FORCE_GREEN');
      this.northSouth.trigger('EMERGENCY_OVERRIDE'); // Forces NS to RED
      console.log('🚨 EW forced to GREEN, NS forced to RED');
    }

    // Add FORCE_GREEN transitions if not already present
    this.addEmergencyTransitions();
  }

  private addEmergencyTransitions(): void {
    // Add FORCE_GREEN transition for emergency vehicle priority
    try {
      this.northSouth.addTransition({
        from: '*',
        to: 'GREEN',
        event: 'FORCE_GREEN',
        action: () => console.log('🚨 NS: Emergency GREEN activated')
      });
    } catch {
      // Transition already exists
    }

    try {
      this.eastWest.addTransition({
        from: '*',
        to: 'GREEN',
        event: 'FORCE_GREEN',
        action: () => console.log('🚨 EW: Emergency GREEN activated')
      });
    } catch {
      // Transition already exists
    }
  }

  // Status methods
  getNorthSouthState(): string {
    try {
      return this.northSouth.getCurrentState();
    } catch {
      return 'NOT_STARTED';
    }
  }

  getEastWestState(): string {
    try {
      return this.eastWest.getCurrentState();
    } catch {
      return 'NOT_STARTED';
    }
  }

  getStatus(): {
    ns: string;
    ew: string;
    running: boolean;
    pedestrianWaiting: { NS: boolean; EW: boolean };
    isSafe: boolean;
  } {
    const nsState = this.getNorthSouthState();
    const ewState = this.getEastWestState();

    // Safety check: both should not be green at the same time
    const isSafe = !(nsState === 'GREEN' && ewState === 'GREEN');

    return {
      ns: nsState,
      ew: ewState,
      running: this.isRunning,
      pedestrianWaiting: { ...this.pedestrianWaiting },
      isSafe
    };
  }

  isOperational(): boolean {
    return this.isRunning;
  }
}
