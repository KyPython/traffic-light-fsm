// Comprehensive Demo of All FSM Examples
import { VendingMachine } from './VendingMachine';
import { ElevatorController } from './ElevatorController';
import { ParkingGarage } from './ParkingGarage';
import { FSMMonitor } from '../monitoring/FSMMonitor';

console.log('🎯 FSM Examples Comprehensive Demo\n');
console.log('=' .repeat(60));

// ============================================================================
// DEMO 1: Vending Machine
// ============================================================================
console.log('\n\n📦 DEMO 1: Vending Machine FSM');
console.log('=' .repeat(60));

const vendingMachine = new VendingMachine(true);
const vmMonitor = new FSMMonitor();
vmMonitor.onStart('IDLE');

console.log('\n--- Scenario: Successful Purchase ---');
vendingMachine.insertCoin(0.50);
vendingMachine.insertCoin(0.50);
vendingMachine.insertCoin(0.50); // Total: $1.50

console.log('\nAvailable items:');
vendingMachine.getInventory().forEach(item => {
  console.log(`  ${item.id}: ${item.name} - $${item.price} (${item.quantity} left)`);
});

console.log('\nSelecting item A1 (Chips - $1.50)...');
vendingMachine.selectItem('A1');

// Simulate dispensing
let elapsed = 0;
const dispensingInterval = setInterval(() => {
  vendingMachine.update(500);
  elapsed += 500;

  if (elapsed >= 3000 || vendingMachine.getCurrentState() === 'IDLE') {
    clearInterval(dispensingInterval);
    console.log(`\n✅ Final state: ${vendingMachine.getCurrentState()}`);
    console.log(`💰 Money inserted: $${vendingMachine.getInsertedAmount().toFixed(2)}`);
  }
}, 500);

setTimeout(() => {
  console.log('\n--- Scenario: Insufficient Payment ---');
  const vm2 = new VendingMachine(false);
  vm2.insertCoin(0.25);
  vm2.insertCoin(0.25); // Only $0.50
  vm2.selectItem('B1'); // Soda costs $2.00
  vm2.insertCoin(1.00); // Add more
  vm2.insertCoin(0.50); // Now have $2.25
  // Should dispense automatically when enough money

  console.log('\n--- Scenario: Cancel Transaction ---');
  const vm3 = new VendingMachine(false);
  vm3.insertCoin(1.00);
  vm3.selectItem('C1');
  console.log('Pressing cancel button...');
  vm3.cancel();
  console.log(`State after cancel: ${vm3.getCurrentState()}`);
}, 4000);

// ============================================================================
// DEMO 2: Elevator Controller (with Hierarchical FSM)
// ============================================================================
setTimeout(() => {
  console.log('\n\n🛗 DEMO 2: Elevator Controller FSM (Hierarchical)');
  console.log('=' .repeat(60));

  const elevator = new ElevatorController(10, true);

  console.log('\n--- Scenario: Call elevator to floor 5 ---');
  elevator.callElevator(5);

  console.log('\nStarting simulation...');
  let time = 0;
  const elevatorInterval = setInterval(() => {
    elevator.update(500);
    time += 500;

    const status = elevator.getStatus();

    if (time % 3000 === 0) {
      console.log(`\n[${(time / 1000).toFixed(1)}s] Status:`, {
        floor: status.currentFloor,
        target: status.targetFloor,
        mainState: status.mainState,
        doorState: status.doorState,
        pending: status.pendingRequests
      });
    }

    // After reaching floor 5, call to floor 2
    if (time === 20000) {
      console.log('\n📞 Calling elevator to floor 2...');
      elevator.callElevator(2);
    }

    // Test emergency stop
    if (time === 35000) {
      console.log('\n🚨 EMERGENCY STOP!');
      elevator.emergencyStop();
    }

    // Stop demo after 40 seconds
    if (time >= 40000) {
      clearInterval(elevatorInterval);
      console.log('\n✅ Elevator demo completed');
      console.log('Final status:', elevator.getStatus());
    }
  }, 500);
}, 8000);

// ============================================================================
// DEMO 3: Parking Garage
// ============================================================================
setTimeout(() => {
  console.log('\n\n🅿️ DEMO 3: Parking Garage FSM');
  console.log('=' .repeat(60));

  const garage = new ParkingGarage(100, true);

  console.log('\n--- Scenario: Vehicle Entry ---');
  console.log('Vehicle arrives at entrance...');
  garage.vehicleArrived();

  setTimeout(() => {
    console.log('\nScanning new ticket...');
    garage.scanTicket('TICKET-001');
  }, 2000);

  // Simulate gate opening and vehicle passing
  let garageTime = 0;
  const garageInterval = setInterval(() => {
    garage.update(500);
    garageTime += 500;

    const status = garage.getStatus();

    if (garageTime % 2000 === 0) {
      console.log(`\n[${(garageTime / 1000).toFixed(1)}s] Garage Status:`, {
        state: status.state,
        gatePosition: `${status.gatePosition.toFixed(0)}%`,
        occupancy: `${status.occupiedSpaces}/${status.totalSpaces}`,
        vehiclePresent: status.vehiclePresent
      });
    }

    // Vehicle clears gate
    if (garageTime === 6000) {
      console.log('\n🚗 Vehicle has cleared the gate');
      garage.vehicleCleared();
    }

    // Test parking and exit
    if (garageTime === 12000) {
      console.log('\n--- Scenario: Vehicle Exit ---');
      console.log('Vehicle returns and scans ticket...');
      garage.vehicleArrived();
    }

    if (garageTime === 14000) {
      console.log('\nPaying for parking...');
      garage.payTicket('TICKET-001');
    }

    if (garageTime === 16000) {
      console.log('\nScanning paid ticket...');
      garage.scanTicket('TICKET-001');
    }

    if (garageTime === 22000) {
      console.log('\n🚗 Vehicle exits');
      garage.vehicleCleared();
    }

    // Test full garage scenario
    if (garageTime === 28000) {
      console.log('\n--- Scenario: Testing Emergency Controls ---');
      console.log('Emergency OPEN activated...');
      garage.emergencyOpen();
    }

    if (garageTime === 30000) {
      console.log('\nEmergency CLOSE activated...');
      garage.emergencyClose();
    }

    if (garageTime >= 35000) {
      clearInterval(garageInterval);
      console.log('\n✅ Parking garage demo completed');
      console.log('Final status:', garage.getStatus());
      console.log(`Occupancy rate: ${garage.getOccupancyRate().toFixed(1)}%`);
    }
  }, 500);
}, 50000);

// ============================================================================
// Summary
// ============================================================================
setTimeout(() => {
  console.log('\n\n' + '=' .repeat(60));
  console.log('🎉 ALL DEMOS COMPLETED');
  console.log('=' .repeat(60));
  console.log('\n✅ Demonstrated FSM patterns:');
  console.log('  1. Vending Machine - Payment flow with timeouts');
  console.log('  2. Elevator - Hierarchical FSM (main + door control)');
  console.log('  3. Parking Garage - Access control with safety features');
  console.log('\n📚 Key features showcased:');
  console.log('  • State transitions with guards');
  console.log('  • Time-based state logic');
  console.log('  • Emergency overrides');
  console.log('  • Nested/Hierarchical FSMs');
  console.log('  • Complex business logic');
  console.log('  • Safety mechanisms');
  console.log('\n💡 Week 3 Session 5 - Advanced FSM Patterns: COMPLETE ✅');
  console.log('=' .repeat(60));
}, 90000);

console.log('\n⏳ Running all demos... (will take ~90 seconds)');
console.log('Watch the console for real-time updates!\n');
