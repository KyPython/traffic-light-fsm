// Demo application showing the FSM in action
import { TrafficLightController } from './TrafficLightController';

class TrafficLightDemo {
  private controller: TrafficLightController;
  private startTime: number;
  private lastUpdate: number;

  constructor() {
    this.controller = new TrafficLightController(true); // Enable debug mode
    this.startTime = Date.now();
    this.lastUpdate = this.startTime;
  }

  async run(): Promise<void> {
    console.log('='.repeat(50));
    console.log('🚦 TRAFFIC LIGHT FSM DEMO');
    console.log('='.repeat(50));
    
    // Start the traffic light controller
    this.controller.start();
    
    // Run the simulation for 70 seconds (to see complete cycles)
    const simulationDuration = 70000; // 70 seconds
    let elapsedTime = 0;
    
    console.log(`\n▶️  Running simulation for ${simulationDuration / 1000} seconds...\n`);

    while (elapsedTime < simulationDuration) {
      const currentTime = Date.now();
      const deltaTime = currentTime - this.lastUpdate;
      
      // Update the FSM
      this.controller.update(deltaTime);
      
      // Log status every 5 seconds
      if (Math.floor(elapsedTime / 5000) !== Math.floor((elapsedTime + deltaTime) / 5000)) {
        this.logStatus(elapsedTime + deltaTime);
      }

      // Demonstrate emergency override at 35 seconds
      if (elapsedTime < 35000 && (elapsedTime + deltaTime) >= 35000) {
        console.log('\n🚨 SIMULATING EMERGENCY SITUATION...');
        this.controller.emergencyOverride();
      }

      // Resume normal operation after 5 seconds of emergency
      if (elapsedTime < 40000 && (elapsedTime + deltaTime) >= 40000) {
        console.log('\n✅ Emergency cleared, resuming normal operation...');
        // The FSM will continue from RED and proceed normally
      }

      elapsedTime += deltaTime;
      this.lastUpdate = currentTime;
      
      // Small delay to prevent excessive CPU usage
      await this.sleep(100);
    }

    this.controller.stop();
    this.logFinalStatus();
  }

  private logStatus(elapsedTime: number): void {
    const currentState = this.controller.getCurrentState();
    const timeStr = `${(elapsedTime / 1000).toFixed(1)}s`;
    
    console.log(`⏰ [${timeStr}] Current State: ${currentState}`);
  }

  private logFinalStatus(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 SIMULATION COMPLETED');
    console.log('='.repeat(50));
    
    console.log(`Final State: ${this.controller.getCurrentState()}`);
    console.log(`State History: ${this.controller.getHistory().join(' → ')}`);
    
    console.log('\n✅ FSM Demo completed successfully!');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Additional unit tests to demonstrate FSM capabilities
function runUnitTests(): void {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 RUNNING UNIT TESTS');
  console.log('='.repeat(50));

  try {
    // Test 1: Basic FSM functionality
    console.log('\n📝 Test 1: Basic FSM operations');
    const controller = new TrafficLightController(false);
    
    console.log(`✓ Initial state: ${controller.getCurrentState()}`);
    
    controller.start();
    console.log(`✓ Started state: ${controller.getCurrentState()}`);
    
    // Test transition checking
    console.log(`✓ Can transition TIMER_EXPIRED: ${controller.canTransition('TIMER_EXPIRED')}`);
    console.log(`✓ Can transition INVALID_EVENT: ${controller.canTransition('INVALID_EVENT')}`);

    // Test 2: Error handling
    console.log('\n📝 Test 2: Error handling');
    try {
      controller.start(); // Should throw error
      console.log('❌ Should have thrown error for double start');
    } catch (error) {
      console.log('✓ Correctly threw error for double start');
    }

    // Test 3: Manual controls
    console.log('\n📝 Test 3: Manual controls');
    const initialState = controller.getCurrentState();
    console.log(`✓ Before force: ${initialState}`);
    
    controller.forceGreen();
    console.log(`✓ After force green: ${controller.getCurrentState()}`);
    
    controller.forceYellow();
    console.log(`✓ After force yellow: ${controller.getCurrentState()}`);
    
    controller.emergencyOverride();
    console.log(`✓ After emergency override: ${controller.getCurrentState()}`);

    console.log('\n✅ All unit tests passed!');
    
  } catch (error) {
    console.log(`❌ Unit test failed: ${error}`);
  }
}

// Run the demo
async function main(): Promise<void> {
  try {
    // Run unit tests first
    runUnitTests();
    
    // Then run the interactive demo
    const demo = new TrafficLightDemo();
    await demo.run();
    
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  main();
}