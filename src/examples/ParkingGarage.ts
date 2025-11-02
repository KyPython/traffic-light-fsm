// Parking Garage FSM Example
// States: GATE_CLOSED, SCANNING_TICKET, GATE_OPENING, GATE_OPEN, GATE_CLOSING
// Events: VEHICLE_DETECTED, TICKET_VALID, TICKET_INVALID, VEHICLE_CLEARED

import { StateMachine, State } from '../fsm/StateMachine';
import { BaseState } from '../fsm/BaseState';

// Parking ticket interface
export interface ParkingTicket {
  id: string;
  entryTime: Date;
  valid: boolean;
  paid: boolean;
}

// Parking Garage States
class GateClosedState extends BaseState {
  constructor(private garage: ParkingGarage) {
    super('GATE_CLOSED');
  }

  onEnter(): void {
    console.log('🚧 Gate: CLOSED - Waiting for vehicle');
    this.garage.setGatePosition(0); // 0 = closed
  }

  onUpdate(deltaTime: number): void {
    // Sensor checks for vehicle presence
  }
}

class ScanningTicketState extends BaseState {
  private scanTimer: number = 0;
  private readonly timeout: number = 10000; // 10 second timeout

  constructor(private garage: ParkingGarage) {
    super('SCANNING_TICKET');
  }

  onEnter(): void {
    this.scanTimer = 0;
    console.log('🎫 Scanning ticket - please wait...');
  }

  onUpdate(deltaTime: number): void {
    this.scanTimer += deltaTime;

    if (this.scanTimer >= this.timeout) {
      console.log('⏰ Ticket scan timeout');
      this.garage.getFSM().trigger('TICKET_INVALID');
    }
  }

  onExit(): void {
    console.log('✅ Ticket scan complete');
  }
}

class GateOpeningState extends BaseState {
  private openTimer: number = 0;
  private readonly duration: number = 3000; // 3 seconds to open

  constructor(private garage: ParkingGarage) {
    super('GATE_OPENING');
  }

  onEnter(): void {
    this.openTimer = 0;
    console.log('🚧 Gate: OPENING...');
  }

  onUpdate(deltaTime: number): void {
    this.openTimer += deltaTime;

    // Animate gate position (0 to 100)
    const progress = Math.min(this.openTimer / this.duration, 1.0);
    this.garage.setGatePosition(progress * 100);

    if (this.openTimer >= this.duration) {
      this.garage.getFSM().trigger('GATE_FULLY_OPEN');
    }
  }
}

class GateOpenState extends BaseState {
  private openTimer: number = 0;
  private readonly timeout: number = 10000; // 10 seconds max open time

  constructor(private garage: ParkingGarage) {
    super('GATE_OPEN');
  }

  onEnter(): void {
    this.openTimer = 0;
    console.log('🚧 Gate: OPEN - Vehicle may proceed');
    this.garage.setGatePosition(100); // 100 = fully open
  }

  onUpdate(deltaTime: number): void {
    this.openTimer += deltaTime;

    if (this.openTimer >= this.timeout) {
      console.log('⏰ Gate open timeout - closing for safety');
      this.garage.getFSM().trigger('TIMEOUT');
    }
  }
}

class GateClosingState extends BaseState {
  private closeTimer: number = 0;
  private readonly duration: number = 3000; // 3 seconds to close

  constructor(private garage: ParkingGarage) {
    super('GATE_CLOSING');
  }

  onEnter(): void {
    this.closeTimer = 0;
    console.log('🚧 Gate: CLOSING...');
  }

  onUpdate(deltaTime: number): void {
    this.closeTimer += deltaTime;

    // Animate gate position (100 to 0)
    const progress = Math.min(this.closeTimer / this.duration, 1.0);
    this.garage.setGatePosition(100 - progress * 100);

    // Safety check: if vehicle detected while closing, reopen
    if (this.garage.isVehicleInGateway()) {
      console.log('🚨 Vehicle detected - reopening gate (safety feature)');
      this.garage.getFSM().trigger('VEHICLE_DETECTED');
      return;
    }

    if (this.closeTimer >= this.duration) {
      this.garage.getFSM().trigger('GATE_FULLY_CLOSED');
    }
  }
}

// Parking Garage Controller
export class ParkingGarage {
  private fsm: StateMachine;
  private gatePosition: number = 0; // 0 = closed, 100 = fully open
  private vehicleInGateway: boolean = false;
  private currentTicket: ParkingTicket | null = null;
  private totalSpaces: number;
  private occupiedSpaces: number = 0;
  private ticketDatabase: Map<string, ParkingTicket> = new Map();

  constructor(totalSpaces: number = 100, debug: boolean = false) {
    this.totalSpaces = totalSpaces;
    this.fsm = new StateMachine(debug);
    this.setupStateMachine();
  }

  private setupStateMachine(): void {
    // Add states
    this.fsm.addState(new GateClosedState(this));
    this.fsm.addState(new ScanningTicketState(this));
    this.fsm.addState(new GateOpeningState(this));
    this.fsm.addState(new GateOpenState(this));
    this.fsm.addState(new GateClosingState(this));

    // Transitions
    this.fsm.addTransition({
      from: 'GATE_CLOSED',
      to: 'SCANNING_TICKET',
      event: 'VEHICLE_DETECTED',
      guard: () => this.hasAvailableSpaces(),
      action: () => console.log('🚗 Vehicle detected at entrance')
    });

    this.fsm.addTransition({
      from: 'GATE_CLOSED',
      to: 'GATE_CLOSED',
      event: 'VEHICLE_DETECTED',
      guard: () => !this.hasAvailableSpaces(),
      action: () => console.log('🚫 Parking garage is FULL')
    });

    this.fsm.addTransition({
      from: 'SCANNING_TICKET',
      to: 'GATE_OPENING',
      event: 'TICKET_VALID',
      action: () => {
        console.log('✅ Ticket is valid - opening gate');
        this.recordEntry();
      }
    });

    this.fsm.addTransition({
      from: 'SCANNING_TICKET',
      to: 'GATE_CLOSED',
      event: 'TICKET_INVALID',
      action: () => {
        console.log('❌ Invalid ticket - access denied');
        this.currentTicket = null;
      }
    });

    this.fsm.addTransition({
      from: 'GATE_OPENING',
      to: 'GATE_OPEN',
      event: 'GATE_FULLY_OPEN'
    });

    this.fsm.addTransition({
      from: 'GATE_OPEN',
      to: 'GATE_CLOSING',
      event: 'VEHICLE_CLEARED',
      action: () => console.log('🚗 Vehicle has passed through')
    });

    this.fsm.addTransition({
      from: 'GATE_OPEN',
      to: 'GATE_CLOSING',
      event: 'TIMEOUT'
    });

    this.fsm.addTransition({
      from: 'GATE_CLOSING',
      to: 'GATE_CLOSED',
      event: 'GATE_FULLY_CLOSED',
      action: () => this.currentTicket = null
    });

    // Safety feature: reopen if vehicle detected while closing
    this.fsm.addTransition({
      from: 'GATE_CLOSING',
      to: 'GATE_OPENING',
      event: 'VEHICLE_DETECTED',
      action: () => console.log('🚨 Safety override - reopening gate')
    });

    // Emergency open/close
    this.fsm.addTransition({
      from: '*',
      to: 'GATE_OPEN',
      event: 'EMERGENCY_OPEN',
      action: () => {
        console.log('🚨 EMERGENCY: Gate forced open');
        this.gatePosition = 100;
      }
    });

    this.fsm.addTransition({
      from: '*',
      to: 'GATE_CLOSED',
      event: 'EMERGENCY_CLOSE',
      action: () => {
        console.log('🚨 EMERGENCY: Gate forced closed');
        this.gatePosition = 0;
      }
    });

    this.fsm.start('GATE_CLOSED');
  }

  // Public API
  vehicleArrived(): void {
    this.vehicleInGateway = true;
    this.fsm.trigger('VEHICLE_DETECTED');
  }

  scanTicket(ticketId: string): void {
    const ticket = this.ticketDatabase.get(ticketId);

    if (!ticket) {
      // New entry - issue ticket
      this.currentTicket = {
        id: ticketId,
        entryTime: new Date(),
        valid: true,
        paid: false
      };
      this.ticketDatabase.set(ticketId, this.currentTicket);
      console.log(`🎫 New ticket issued: ${ticketId}`);
      this.fsm.trigger('TICKET_VALID');
    } else if (ticket.valid && ticket.paid) {
      // Exit - ticket is paid
      this.currentTicket = ticket;
      console.log(`🎫 Exit ticket validated: ${ticketId}`);
      this.fsm.trigger('TICKET_VALID');
    } else if (!ticket.paid) {
      console.log(`❌ Ticket ${ticketId} not paid`);
      this.fsm.trigger('TICKET_INVALID');
    } else {
      console.log(`❌ Ticket ${ticketId} is invalid`);
      this.fsm.trigger('TICKET_INVALID');
    }
  }

  vehicleCleared(): void {
    this.vehicleInGateway = false;
    this.fsm.trigger('VEHICLE_CLEARED');
  }

  payTicket(ticketId: string): boolean {
    const ticket = this.ticketDatabase.get(ticketId);

    if (!ticket) {
      console.log(`❌ Ticket ${ticketId} not found`);
      return false;
    }

    const now = new Date();
    const duration = now.getTime() - ticket.entryTime.getTime();
    const hours = Math.ceil(duration / (1000 * 60 * 60));
    const cost = hours * 5; // $5 per hour

    console.log(`💳 Payment: $${cost} for ${hours} hour(s)`);
    ticket.paid = true;

    return true;
  }

  emergencyOpen(): void {
    this.fsm.trigger('EMERGENCY_OPEN');
  }

  emergencyClose(): void {
    this.fsm.trigger('EMERGENCY_CLOSE');
  }

  // Helper methods
  getFSM(): StateMachine {
    return this.fsm;
  }

  setGatePosition(position: number): void {
    this.gatePosition = Math.max(0, Math.min(100, position));
  }

  getGatePosition(): number {
    return this.gatePosition;
  }

  isVehicleInGateway(): boolean {
    return this.vehicleInGateway;
  }

  hasAvailableSpaces(): boolean {
    return this.occupiedSpaces < this.totalSpaces;
  }

  private recordEntry(): void {
    if (this.currentTicket && !this.currentTicket.paid) {
      // New entry
      this.occupiedSpaces++;
      console.log(`📊 Occupied spaces: ${this.occupiedSpaces}/${this.totalSpaces}`);
    } else if (this.currentTicket && this.currentTicket.paid) {
      // Exit
      this.occupiedSpaces--;
      this.currentTicket.valid = false; // Invalidate ticket
      console.log(`📊 Occupied spaces: ${this.occupiedSpaces}/${this.totalSpaces}`);
    }
  }

  update(deltaTime: number): void {
    this.fsm.update(deltaTime);
  }

  getCurrentState(): string {
    return this.fsm.getCurrentState();
  }

  getStatus(): {
    state: string;
    gatePosition: number;
    occupiedSpaces: number;
    totalSpaces: number;
    availableSpaces: number;
    vehiclePresent: boolean;
  } {
    return {
      state: this.getCurrentState(),
      gatePosition: this.gatePosition,
      occupiedSpaces: this.occupiedSpaces,
      totalSpaces: this.totalSpaces,
      availableSpaces: this.totalSpaces - this.occupiedSpaces,
      vehiclePresent: this.vehicleInGateway
    };
  }

  getOccupancyRate(): number {
    return (this.occupiedSpaces / this.totalSpaces) * 100;
  }
}
