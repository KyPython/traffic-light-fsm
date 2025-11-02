// Elevator Controller FSM with Hierarchical States
// States: IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN, DOOR_CLOSING
// Events: CALL_BUTTON, FLOOR_REACHED, DOOR_TIMEOUT
// Nested FSM: Door control (CLOSED, OPENING, OPEN, CLOSING)

import { StateMachine, State } from '../fsm/StateMachine';
import { BaseState } from '../fsm/BaseState';

// Floor request interface
interface FloorRequest {
  floor: number;
  direction: 'UP' | 'DOWN' | 'NONE';
}

// Door States (Nested FSM)
class DoorClosedState extends BaseState {
  constructor(private elevator: ElevatorController) {
    super('DOOR_CLOSED');
  }

  onEnter(): void {
    console.log('🚪 Door: CLOSED');
    this.elevator.setDoorStatus(false);
  }

  onUpdate(deltaTime: number): void {}
}

class DoorOpeningState extends BaseState {
  private timer: number = 0;
  private readonly duration: number = 2000; // 2 seconds

  constructor(private elevator: ElevatorController) {
    super('DOOR_OPENING');
  }

  onEnter(): void {
    this.timer = 0;
    console.log('🚪 Door: OPENING...');
  }

  onUpdate(deltaTime: number): void {
    this.timer += deltaTime;
    if (this.timer >= this.duration) {
      this.elevator.getDoorFSM().trigger('OPEN_COMPLETE');
    }
  }
}

class DoorOpenState extends BaseState {
  private timer: number = 0;
  private readonly duration: number = 5000; // 5 seconds hold time

  constructor(private elevator: ElevatorController) {
    super('DOOR_OPEN');
  }

  onEnter(): void {
    this.timer = 0;
    console.log('🚪 Door: OPEN');
    this.elevator.setDoorStatus(true);
  }

  onUpdate(deltaTime: number): void {
    this.timer += deltaTime;
    if (this.timer >= this.duration) {
      console.log('⏰ Door timeout - closing doors');
      this.elevator.getDoorFSM().trigger('DOOR_TIMEOUT');
    }
  }
}

class DoorClosingState extends BaseState {
  private timer: number = 0;
  private readonly duration: number = 2000; // 2 seconds

  constructor(private elevator: ElevatorController) {
    super('DOOR_CLOSING');
  }

  onEnter(): void {
    this.timer = 0;
    console.log('🚪 Door: CLOSING...');
  }

  onUpdate(deltaTime: number): void {
    this.timer += deltaTime;
    if (this.timer >= this.duration) {
      this.elevator.getDoorFSM().trigger('CLOSE_COMPLETE');
    }
  }
}

// Elevator Main States
class ElevatorIdleState extends BaseState {
  constructor(private elevator: ElevatorController) {
    super('IDLE');
  }

  onEnter(): void {
    console.log('🛗 Elevator: IDLE');
  }

  onUpdate(deltaTime: number): void {
    // Check for pending requests
    const nextFloor = this.elevator.getNextFloor();
    if (nextFloor !== null) {
      this.elevator.setTargetFloor(nextFloor);

      if (nextFloor > this.elevator.getCurrentFloor()) {
        this.elevator.getMainFSM().trigger('MOVE_UP');
      } else if (nextFloor < this.elevator.getCurrentFloor()) {
        this.elevator.getMainFSM().trigger('MOVE_DOWN');
      } else {
        // Already at floor, just open door
        this.elevator.getMainFSM().trigger('OPEN_DOOR');
      }
    }
  }
}

class ElevatorMovingUpState extends BaseState {
  private moveTimer: number = 0;
  private readonly floorTime: number = 3000; // 3 seconds per floor

  constructor(private elevator: ElevatorController) {
    super('MOVING_UP');
  }

  onEnter(): void {
    this.moveTimer = 0;
    console.log(`🛗 Elevator: MOVING UP (Current: ${this.elevator.getCurrentFloor()})`);
  }

  onUpdate(deltaTime: number): void {
    this.moveTimer += deltaTime;

    if (this.moveTimer >= this.floorTime) {
      this.moveTimer = 0;
      this.elevator.incrementFloor();
      console.log(`🛗 Passing floor ${this.elevator.getCurrentFloor()}`);

      if (this.elevator.getCurrentFloor() >= this.elevator.getTargetFloor()) {
        console.log(`🎯 Reached target floor ${this.elevator.getCurrentFloor()}`);
        this.elevator.getMainFSM().trigger('FLOOR_REACHED');
      }
    }
  }
}

class ElevatorMovingDownState extends BaseState {
  private moveTimer: number = 0;
  private readonly floorTime: number = 3000; // 3 seconds per floor

  constructor(private elevator: ElevatorController) {
    super('MOVING_DOWN');
  }

  onEnter(): void {
    this.moveTimer = 0;
    console.log(`🛗 Elevator: MOVING DOWN (Current: ${this.elevator.getCurrentFloor()})`);
  }

  onUpdate(deltaTime: number): void {
    this.moveTimer += deltaTime;

    if (this.moveTimer >= this.floorTime) {
      this.moveTimer = 0;
      this.elevator.decrementFloor();
      console.log(`🛗 Passing floor ${this.elevator.getCurrentFloor()}`);

      if (this.elevator.getCurrentFloor() <= this.elevator.getTargetFloor()) {
        console.log(`🎯 Reached target floor ${this.elevator.getCurrentFloor()}`);
        this.elevator.getMainFSM().trigger('FLOOR_REACHED');
      }
    }
  }
}

// Elevator Controller with Hierarchical FSM
export class ElevatorController {
  private mainFSM: StateMachine;
  private doorFSM: StateMachine;

  private currentFloor: number = 1;
  private targetFloor: number = 1;
  private floorRequests: Set<number> = new Set();
  private doorOpen: boolean = false;

  constructor(private totalFloors: number = 10, debug: boolean = false) {
    this.mainFSM = new StateMachine(debug);
    this.doorFSM = new StateMachine(debug);

    this.setupDoorFSM();
    this.setupMainFSM();
  }

  private setupDoorFSM(): void {
    // Add door states
    this.doorFSM.addState(new DoorClosedState(this));
    this.doorFSM.addState(new DoorOpeningState(this));
    this.doorFSM.addState(new DoorOpenState(this));
    this.doorFSM.addState(new DoorClosingState(this));

    // Door transitions
    this.doorFSM.addTransition({
      from: 'DOOR_CLOSED',
      to: 'DOOR_OPENING',
      event: 'OPEN_DOOR'
    });

    this.doorFSM.addTransition({
      from: 'DOOR_OPENING',
      to: 'DOOR_OPEN',
      event: 'OPEN_COMPLETE'
    });

    this.doorFSM.addTransition({
      from: 'DOOR_OPEN',
      to: 'DOOR_CLOSING',
      event: 'DOOR_TIMEOUT'
    });

    this.doorFSM.addTransition({
      from: 'DOOR_OPEN',
      to: 'DOOR_CLOSING',
      event: 'CLOSE_DOOR'
    });

    this.doorFSM.addTransition({
      from: 'DOOR_CLOSING',
      to: 'DOOR_CLOSED',
      event: 'CLOSE_COMPLETE'
    });

    // Safety: if door is closing and open button pressed, reopen
    this.doorFSM.addTransition({
      from: 'DOOR_CLOSING',
      to: 'DOOR_OPENING',
      event: 'OPEN_DOOR',
      action: () => console.log('🚨 Door reopening (safety feature)')
    });

    this.doorFSM.start('DOOR_CLOSED');
  }

  private setupMainFSM(): void {
    // Add elevator states
    this.mainFSM.addState(new ElevatorIdleState(this));
    this.mainFSM.addState(new ElevatorMovingUpState(this));
    this.mainFSM.addState(new ElevatorMovingDownState(this));

    // Main transitions
    this.mainFSM.addTransition({
      from: 'IDLE',
      to: 'MOVING_UP',
      event: 'MOVE_UP',
      guard: () => this.isDoorClosed()
    });

    this.mainFSM.addTransition({
      from: 'IDLE',
      to: 'MOVING_DOWN',
      event: 'MOVE_DOWN',
      guard: () => this.isDoorClosed()
    });

    this.mainFSM.addTransition({
      from: 'MOVING_UP',
      to: 'IDLE',
      event: 'FLOOR_REACHED',
      action: () => {
        this.floorRequests.delete(this.currentFloor);
        this.doorFSM.trigger('OPEN_DOOR');
      }
    });

    this.mainFSM.addTransition({
      from: 'MOVING_DOWN',
      to: 'IDLE',
      event: 'FLOOR_REACHED',
      action: () => {
        this.floorRequests.delete(this.currentFloor);
        this.doorFSM.trigger('OPEN_DOOR');
      }
    });

    this.mainFSM.addTransition({
      from: 'IDLE',
      to: 'IDLE',
      event: 'OPEN_DOOR',
      action: () => this.doorFSM.trigger('OPEN_DOOR')
    });

    // Emergency stop
    this.mainFSM.addTransition({
      from: '*',
      to: 'IDLE',
      event: 'EMERGENCY_STOP',
      action: () => console.log('🚨 EMERGENCY STOP ACTIVATED')
    });

    this.mainFSM.start('IDLE');
  }

  // Public API
  callElevator(floor: number): void {
    if (floor < 1 || floor > this.totalFloors) {
      console.log(`❌ Invalid floor: ${floor}`);
      return;
    }

    console.log(`📞 Call button pressed for floor ${floor}`);
    this.floorRequests.add(floor);
  }

  openDoor(): void {
    this.doorFSM.trigger('OPEN_DOOR');
  }

  closeDoor(): void {
    this.doorFSM.trigger('CLOSE_DOOR');
  }

  emergencyStop(): void {
    this.mainFSM.trigger('EMERGENCY_STOP');
  }

  // Helper methods
  getMainFSM(): StateMachine {
    return this.mainFSM;
  }

  getDoorFSM(): StateMachine {
    return this.doorFSM;
  }

  getCurrentFloor(): number {
    return this.currentFloor;
  }

  getTargetFloor(): number {
    return this.targetFloor;
  }

  setTargetFloor(floor: number): void {
    this.targetFloor = floor;
  }

  incrementFloor(): void {
    if (this.currentFloor < this.totalFloors) {
      this.currentFloor++;
    }
  }

  decrementFloor(): void {
    if (this.currentFloor > 1) {
      this.currentFloor--;
    }
  }

  setDoorStatus(open: boolean): void {
    this.doorOpen = open;
  }

  isDoorClosed(): boolean {
    return !this.doorOpen;
  }

  getNextFloor(): number | null {
    if (this.floorRequests.size === 0) {
      return null;
    }

    // Simple algorithm: closest floor
    const requests = Array.from(this.floorRequests);
    requests.sort((a, b) =>
      Math.abs(a - this.currentFloor) - Math.abs(b - this.currentFloor)
    );

    return requests[0];
  }

  update(deltaTime: number): void {
    this.mainFSM.update(deltaTime);
    this.doorFSM.update(deltaTime);
  }

  getStatus(): {
    currentFloor: number;
    targetFloor: number;
    mainState: string;
    doorState: string;
    doorOpen: boolean;
    pendingRequests: number[];
  } {
    return {
      currentFloor: this.currentFloor,
      targetFloor: this.targetFloor,
      mainState: this.mainFSM.getCurrentState(),
      doorState: this.doorFSM.getCurrentState(),
      doorOpen: this.doorOpen,
      pendingRequests: Array.from(this.floorRequests)
    };
  }
}
