// Vending Machine FSM Example
// States: IDLE → SELECTING → PAYMENT → DISPENSING → IDLE
// Events: INSERT_COIN, SELECT_ITEM, CANCEL, DISPENSE_COMPLETE

import { StateMachine, State } from '../fsm/StateMachine';
import { BaseState } from '../fsm/BaseState';

// Item interface
export interface VendingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Vending Machine States
class IdleState extends BaseState {
  constructor(private machine: VendingMachine) {
    super('IDLE');
  }

  onEnter(): void {
    console.log('💤 Vending Machine: Ready for use');
    this.machine.resetSelection();
  }

  onUpdate(deltaTime: number): void {
    // Display available items
  }
}

class SelectingState extends BaseState {
  constructor(private machine: VendingMachine) {
    super('SELECTING');
  }

  onEnter(): void {
    console.log('🔍 Vending Machine: Please select an item');
  }

  onUpdate(deltaTime: number): void {
    // Wait for item selection
  }
}

class PaymentState extends BaseState {
  private paymentTimer: number = 0;
  private readonly timeout: number = 30000; // 30 second timeout

  constructor(private machine: VendingMachine) {
    super('PAYMENT');
  }

  onEnter(): void {
    this.paymentTimer = 0;
    const required = this.machine.getRequiredPayment();
    console.log(`💳 Payment required: $${required.toFixed(2)}`);
  }

  onUpdate(deltaTime: number): void {
    this.paymentTimer += deltaTime;

    if (this.paymentTimer >= this.timeout) {
      console.log('⏰ Payment timeout - canceling transaction');
      this.machine.getFSM().trigger('CANCEL');
    }
  }
}

class DispensingState extends BaseState {
  private dispenseTimer: number = 0;
  private readonly duration: number = 3000; // 3 seconds to dispense

  constructor(private machine: VendingMachine) {
    super('DISPENSING');
  }

  onEnter(): void {
    this.dispenseTimer = 0;
    console.log('📦 Dispensing item...');
  }

  onUpdate(deltaTime: number): void {
    this.dispenseTimer += deltaTime;

    if (this.dispenseTimer >= this.duration) {
      console.log('✅ Item dispensed successfully');
      this.machine.getFSM().trigger('DISPENSE_COMPLETE');
    }
  }
}

// Vending Machine Controller
export class VendingMachine {
  private fsm: StateMachine;
  private inventory: Map<string, VendingItem> = new Map();
  private insertedAmount: number = 0;
  private selectedItem: VendingItem | null = null;

  constructor(debug: boolean = false) {
    this.fsm = new StateMachine(debug);
    this.setupInventory();
    this.setupStateMachine();
  }

  private setupInventory(): void {
    const items: VendingItem[] = [
      { id: 'A1', name: 'Chips', price: 1.50, quantity: 10 },
      { id: 'A2', name: 'Candy', price: 1.00, quantity: 15 },
      { id: 'B1', name: 'Soda', price: 2.00, quantity: 8 },
      { id: 'B2', name: 'Water', price: 1.25, quantity: 12 },
      { id: 'C1', name: 'Cookie', price: 1.75, quantity: 6 }
    ];

    items.forEach(item => this.inventory.set(item.id, item));
  }

  private setupStateMachine(): void {
    // Add states
    this.fsm.addState(new IdleState(this));
    this.fsm.addState(new SelectingState(this));
    this.fsm.addState(new PaymentState(this));
    this.fsm.addState(new DispensingState(this));

    // Add transitions
    this.fsm.addTransition({
      from: 'IDLE',
      to: 'SELECTING',
      event: 'INSERT_COIN',
      action: () => console.log('💰 Coin inserted - please select item')
    });

    this.fsm.addTransition({
      from: 'SELECTING',
      to: 'PAYMENT',
      event: 'SELECT_ITEM',
      guard: () => this.selectedItem !== null,
      action: () => console.log(`📋 Item selected: ${this.selectedItem?.name}`)
    });

    this.fsm.addTransition({
      from: 'PAYMENT',
      to: 'DISPENSING',
      event: 'PAYMENT_COMPLETE',
      guard: () => this.hasEnoughMoney(),
      action: () => {
        this.dispenseChange();
        this.decrementInventory();
      }
    });

    this.fsm.addTransition({
      from: 'DISPENSING',
      to: 'IDLE',
      event: 'DISPENSE_COMPLETE'
    });

    this.fsm.addTransition({
      from: '*',
      to: 'IDLE',
      event: 'CANCEL',
      action: () => {
        this.refundMoney();
        console.log('❌ Transaction canceled');
      }
    });

    // Start in IDLE state
    this.fsm.start('IDLE');
  }

  // Public API
  insertCoin(amount: number): void {
    this.insertedAmount += amount;
    console.log(`💰 Inserted $${amount.toFixed(2)} (Total: $${this.insertedAmount.toFixed(2)})`);

    const currentState = this.fsm.getCurrentState();
    if (currentState === 'IDLE') {
      this.fsm.trigger('INSERT_COIN');
    } else if (currentState === 'PAYMENT') {
      if (this.hasEnoughMoney()) {
        this.fsm.trigger('PAYMENT_COMPLETE');
      }
    }
  }

  selectItem(itemId: string): boolean {
    const item = this.inventory.get(itemId);

    if (!item) {
      console.log(`❌ Item ${itemId} not found`);
      return false;
    }

    if (item.quantity <= 0) {
      console.log(`❌ ${item.name} is out of stock`);
      return false;
    }

    this.selectedItem = item;
    return this.fsm.trigger('SELECT_ITEM');
  }

  cancel(): void {
    this.fsm.trigger('CANCEL');
  }

  // Helper methods
  getFSM(): StateMachine {
    return this.fsm;
  }

  resetSelection(): void {
    this.selectedItem = null;
    this.insertedAmount = 0;
  }

  getRequiredPayment(): number {
    return this.selectedItem ? this.selectedItem.price : 0;
  }

  private hasEnoughMoney(): boolean {
    if (!this.selectedItem) return false;
    return this.insertedAmount >= this.selectedItem.price;
  }

  private dispenseChange(): void {
    if (!this.selectedItem) return;

    const change = this.insertedAmount - this.selectedItem.price;
    if (change > 0) {
      console.log(`💵 Change: $${change.toFixed(2)}`);
    }
  }

  private refundMoney(): void {
    if (this.insertedAmount > 0) {
      console.log(`💵 Refunding: $${this.insertedAmount.toFixed(2)}`);
      this.insertedAmount = 0;
    }
  }

  private decrementInventory(): void {
    if (!this.selectedItem) return;

    const item = this.inventory.get(this.selectedItem.id);
    if (item) {
      item.quantity--;
      console.log(`📊 ${item.name} remaining: ${item.quantity}`);
    }
  }

  update(deltaTime: number): void {
    this.fsm.update(deltaTime);
  }

  getCurrentState(): string {
    return this.fsm.getCurrentState();
  }

  getInventory(): VendingItem[] {
    return Array.from(this.inventory.values());
  }

  getInsertedAmount(): number {
    return this.insertedAmount;
  }

  getSelectedItem(): VendingItem | null {
    return this.selectedItem;
  }
}
