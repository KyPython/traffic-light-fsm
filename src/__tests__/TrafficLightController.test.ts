// Traffic Light Controller Tests
import { TrafficLightController } from '../TrafficLightController';

describe('TrafficLightController', () => {
  let controller: TrafficLightController;

  beforeEach(() => {
    controller = new TrafficLightController(false);
  });

  describe('Initialization', () => {
    test('should initialize without starting', () => {
      expect(controller.getCurrentState()).toBe('NOT_STARTED');
      expect(controller.isOperational()).toBe(false);
    });
  });

  describe('Start/Stop', () => {
    test('should start in RED state', () => {
      controller.start();
      expect(controller.getCurrentState()).toBe('RED');
      expect(controller.isOperational()).toBe(true);
    });

    test('should throw error when starting already running controller', () => {
      controller.start();
      expect(() => controller.start()).toThrow(
        'Traffic light controller is already running'
      );
    });

    test('should stop controller', () => {
      controller.start();
      controller.stop();
      expect(controller.isOperational()).toBe(false);
    });
  });

  describe('State Transitions', () => {
    beforeEach(() => {
      controller.start();
    });

    test('should transition RED -> GREEN after timer expires', (done) => {
      expect(controller.getCurrentState()).toBe('RED');

      // Simulate 30 seconds (RED duration)
      let elapsed = 0;
      const interval = setInterval(() => {
        controller.update(1000); // Update 1 second at a time
        elapsed += 1000;

        if (elapsed >= 30000) {
          clearInterval(interval);
          expect(controller.getCurrentState()).toBe('GREEN');
          done();
        }
      }, 10);
    }, 35000);

    test('should complete full cycle: RED -> GREEN -> YELLOW -> RED', (done) => {
      const states: string[] = [];

      let elapsed = 0;
      const interval = setInterval(() => {
        const currentState = controller.getCurrentState();
        if (states[states.length - 1] !== currentState) {
          states.push(currentState);
        }

        controller.update(1000);
        elapsed += 1000;

        // Full cycle = 30s + 25s + 5s = 60s
        if (elapsed >= 60000) {
          clearInterval(interval);
          expect(states).toEqual(['RED', 'GREEN', 'YELLOW', 'RED']);
          done();
        }
      }, 10);
    }, 65000);
  });

  describe('Emergency Override', () => {
    test('should force to RED on emergency override', () => {
      controller.start();

      // Fast-forward to GREEN
      for (let i = 0; i < 30; i++) {
        controller.update(1000);
      }
      expect(controller.getCurrentState()).toBe('GREEN');

      // Emergency override
      controller.emergencyOverride();
      expect(controller.getCurrentState()).toBe('RED');
    });

    test('should not trigger emergency when not running', () => {
      const result = controller.emergencyOverride();
      expect(result).toBe(false);
    });
  });

  describe('Manual Controls', () => {
    beforeEach(() => {
      controller.start();
    });

    test('should force GREEN', () => {
      expect(controller.getCurrentState()).toBe('RED');
      controller.forceGreen();
      expect(controller.getCurrentState()).toBe('GREEN');
    });

    test('should force YELLOW', () => {
      expect(controller.getCurrentState()).toBe('RED');
      controller.forceYellow();
      expect(controller.getCurrentState()).toBe('YELLOW');
    });

    test('should force RED', () => {
      // Move to GREEN first
      controller.forceGreen();
      expect(controller.getCurrentState()).toBe('GREEN');

      controller.forceRed();
      expect(controller.getCurrentState()).toBe('RED');
    });

    test('should not allow manual control when stopped', () => {
      controller.stop();
      const result = controller.forceGreen();
      expect(result).toBe(false);
    });
  });

  describe('State History', () => {
    test('should track state history', () => {
      controller.start();
      expect(controller.getHistory()).toContain('RED');

      controller.forceGreen();
      expect(controller.getHistory()).toContain('GREEN');

      controller.forceYellow();
      expect(controller.getHistory()).toContain('YELLOW');

      const history = controller.getHistory();
      expect(history).toEqual(['RED', 'GREEN', 'YELLOW']);
    });
  });

  describe('Transition Capability', () => {
    beforeEach(() => {
      controller.start();
    });

    test('should check if emergency override is possible', () => {
      expect(controller.canTransition('EMERGENCY_OVERRIDE')).toBe(true);
    });

    test('should check if force transitions are possible', () => {
      expect(controller.canTransition('FORCE_GREEN')).toBe(true);
      expect(controller.canTransition('FORCE_YELLOW')).toBe(true);
      expect(controller.canTransition('FORCE_RED')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle multiple rapid updates', () => {
      controller.start();

      // Simulate 100 rapid updates
      for (let i = 0; i < 100; i++) {
        controller.update(10);
      }

      // Should still be in RED (only 1 second passed)
      expect(controller.getCurrentState()).toBe('RED');
    });

    test('should handle update when stopped', () => {
      controller.start();
      controller.stop();

      expect(() => {
        controller.update(1000);
      }).not.toThrow();
    });

    test('should maintain state consistency across cycles', (done) => {
      controller.start();
      let cycleCount = 0;

      const checkCycle = () => {
        const state = controller.getCurrentState();

        if (state === 'RED' && cycleCount > 0) {
          // Completed a full cycle
          cycleCount++;

          if (cycleCount >= 3) {
            // After 3 cycles, verify pattern holds
            done();
            return;
          }
        }

        if (state === 'YELLOW') {
          cycleCount++;
        }

        controller.update(500);
        setTimeout(checkCycle, 10);
      };

      checkCycle();
    }, 200000); // Allow enough time for 3 full cycles
  });
});
