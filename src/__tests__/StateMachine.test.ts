// Comprehensive test suite for StateMachine
import { StateMachine, State, Transition } from '../fsm/StateMachine';

describe('StateMachine Core Functionality', () => {
  let fsm: StateMachine;

  beforeEach(() => {
    fsm = new StateMachine(false);
  });

  describe('State Management', () => {
    test('should add states successfully', () => {
      const state: State = { name: 'TEST_STATE' };
      expect(() => fsm.addState(state)).not.toThrow();
    });

    test('should throw error when adding duplicate state', () => {
      const state: State = { name: 'DUPLICATE' };
      fsm.addState(state);
      expect(() => fsm.addState(state)).toThrow("State 'DUPLICATE' already exists");
    });

    test('should start in initial state', () => {
      fsm.addState({ name: 'INITIAL' });
      fsm.start('INITIAL');
      expect(fsm.getCurrentState()).toBe('INITIAL');
    });

    test('should throw error when starting with non-existent state', () => {
      expect(() => fsm.start('NON_EXISTENT')).toThrow(
        "Cannot start FSM: State 'NON_EXISTENT' not found"
      );
    });

    test('should throw error when starting already started FSM', () => {
      fsm.addState({ name: 'INITIAL' });
      fsm.start('INITIAL');
      expect(() => fsm.start('INITIAL')).toThrow(
        'FSM is already started. Use trigger() to change states.'
      );
    });

    test('should throw error when getting state of unstarted FSM', () => {
      expect(() => fsm.getCurrentState()).toThrow(
        'FSM not started. Call start() first.'
      );
    });
  });

  describe('Transitions', () => {
    beforeEach(() => {
      fsm.addState({ name: 'A' });
      fsm.addState({ name: 'B' });
      fsm.addState({ name: 'C' });
    });

    test('should transition on valid event', () => {
      fsm.addTransition({ from: 'A', to: 'B', event: 'GO' });
      fsm.start('A');

      const success = fsm.trigger('GO');
      expect(success).toBe(true);
      expect(fsm.getCurrentState()).toBe('B');
    });

    test('should not transition on invalid event', () => {
      fsm.addTransition({ from: 'A', to: 'B', event: 'GO' });
      fsm.start('A');

      const success = fsm.trigger('INVALID_EVENT');
      expect(success).toBe(false);
      expect(fsm.getCurrentState()).toBe('A');
    });

    test('should handle multiple transitions', () => {
      fsm.addTransition({ from: 'A', to: 'B', event: 'NEXT' });
      fsm.addTransition({ from: 'B', to: 'C', event: 'NEXT' });
      fsm.start('A');

      fsm.trigger('NEXT');
      expect(fsm.getCurrentState()).toBe('B');

      fsm.trigger('NEXT');
      expect(fsm.getCurrentState()).toBe('C');
    });

    test('should throw error when adding transition with non-existent source state', () => {
      expect(() =>
        fsm.addTransition({ from: 'NON_EXISTENT', to: 'B', event: 'GO' })
      ).toThrow("Source state 'NON_EXISTENT' does not exist");
    });

    test('should throw error when adding transition with non-existent target state', () => {
      expect(() =>
        fsm.addTransition({ from: 'A', to: 'NON_EXISTENT', event: 'GO' })
      ).toThrow("Target state 'NON_EXISTENT' does not exist");
    });

    test('should throw error when triggering event on unstarted FSM', () => {
      fsm.addTransition({ from: 'A', to: 'B', event: 'GO' });
      expect(() => fsm.trigger('GO')).toThrow('FSM not started. Call start() first.');
    });
  });

  describe('Global Transitions (Wildcard)', () => {
    beforeEach(() => {
      fsm.addState({ name: 'A' });
      fsm.addState({ name: 'B' });
      fsm.addState({ name: 'EMERGENCY' });
    });

    test('should transition from any state with wildcard', () => {
      fsm.addTransition({ from: '*', to: 'EMERGENCY', event: 'PANIC' });
      fsm.start('A');

      fsm.trigger('PANIC');
      expect(fsm.getCurrentState()).toBe('EMERGENCY');
    });

    test('should handle wildcard transition from multiple states', () => {
      fsm.addTransition({ from: 'A', to: 'B', event: 'NEXT' });
      fsm.addTransition({ from: '*', to: 'EMERGENCY', event: 'PANIC' });
      fsm.start('A');

      fsm.trigger('NEXT');
      expect(fsm.getCurrentState()).toBe('B');

      fsm.trigger('PANIC');
      expect(fsm.getCurrentState()).toBe('EMERGENCY');
    });
  });

  describe('Guards', () => {
    beforeEach(() => {
      fsm.addState({ name: 'A' });
      fsm.addState({ name: 'B' });
    });

    test('should respect guard conditions', () => {
      let allowTransition = false;

      fsm.addTransition({
        from: 'A',
        to: 'B',
        event: 'GO',
        guard: () => allowTransition
      });
      fsm.start('A');

      // Should fail guard
      expect(fsm.trigger('GO')).toBe(false);
      expect(fsm.getCurrentState()).toBe('A');

      // Should pass guard
      allowTransition = true;
      expect(fsm.trigger('GO')).toBe(true);
      expect(fsm.getCurrentState()).toBe('B');
    });

    test('should check guard before transition', () => {
      let guardCalled = false;

      fsm.addTransition({
        from: 'A',
        to: 'B',
        event: 'GO',
        guard: () => {
          guardCalled = true;
          return false;
        }
      });
      fsm.start('A');

      fsm.trigger('GO');
      expect(guardCalled).toBe(true);
      expect(fsm.getCurrentState()).toBe('A');
    });
  });

  describe('Actions', () => {
    beforeEach(() => {
      fsm.addState({ name: 'A' });
      fsm.addState({ name: 'B' });
    });

    test('should execute transition actions', () => {
      let actionExecuted = false;

      fsm.addTransition({
        from: 'A',
        to: 'B',
        event: 'GO',
        action: () => {
          actionExecuted = true;
        }
      });
      fsm.start('A');

      fsm.trigger('GO');
      expect(actionExecuted).toBe(true);
    });

    test('should execute action after guard passes', () => {
      let guardChecked = false;
      let actionExecuted = false;

      fsm.addTransition({
        from: 'A',
        to: 'B',
        event: 'GO',
        guard: () => {
          guardChecked = true;
          return true;
        },
        action: () => {
          actionExecuted = true;
          expect(guardChecked).toBe(true);
        }
      });
      fsm.start('A');

      fsm.trigger('GO');
      expect(actionExecuted).toBe(true);
    });

    test('should not execute action if guard fails', () => {
      let actionExecuted = false;

      fsm.addTransition({
        from: 'A',
        to: 'B',
        event: 'GO',
        guard: () => false,
        action: () => {
          actionExecuted = true;
        }
      });
      fsm.start('A');

      fsm.trigger('GO');
      expect(actionExecuted).toBe(false);
    });
  });

  describe('State Lifecycle', () => {
    test('should call onEnter when entering state', () => {
      let enterCalled = false;

      fsm.addState({
        name: 'A',
        onEnter: () => {
          enterCalled = true;
        }
      });

      fsm.start('A');
      expect(enterCalled).toBe(true);
    });

    test('should call onExit when leaving state', () => {
      let exitCalled = false;

      fsm.addState({
        name: 'A',
        onExit: () => {
          exitCalled = true;
        }
      });
      fsm.addState({ name: 'B' });
      fsm.addTransition({ from: 'A', to: 'B', event: 'GO' });

      fsm.start('A');
      fsm.trigger('GO');
      expect(exitCalled).toBe(true);
    });

    test('should call lifecycle methods in correct order', () => {
      const callOrder: string[] = [];

      fsm.addState({
        name: 'A',
        onEnter: () => callOrder.push('A-enter'),
        onExit: () => callOrder.push('A-exit')
      });
      fsm.addState({
        name: 'B',
        onEnter: () => callOrder.push('B-enter')
      });
      fsm.addTransition({
        from: 'A',
        to: 'B',
        event: 'GO',
        action: () => callOrder.push('action')
      });

      fsm.start('A');
      expect(callOrder).toEqual(['A-enter']);

      fsm.trigger('GO');
      expect(callOrder).toEqual(['A-enter', 'A-exit', 'action', 'B-enter']);
    });
  });

  describe('History Tracking', () => {
    beforeEach(() => {
      fsm.addState({ name: 'A' });
      fsm.addState({ name: 'B' });
      fsm.addState({ name: 'C' });
      fsm.addTransition({ from: 'A', to: 'B', event: 'NEXT' });
      fsm.addTransition({ from: 'B', to: 'C', event: 'NEXT' });
    });

    test('should track state history', () => {
      fsm.start('A');
      fsm.trigger('NEXT');
      fsm.trigger('NEXT');

      const history = fsm.getHistory();
      expect(history).toEqual(['A', 'B', 'C']);
    });

    test('should return copy of history', () => {
      fsm.start('A');
      const history1 = fsm.getHistory();
      history1.push('FAKE');

      const history2 = fsm.getHistory();
      expect(history2).toEqual(['A']);
    });
  });

  describe('Transition Capability Checking', () => {
    beforeEach(() => {
      fsm.addState({ name: 'A' });
      fsm.addState({ name: 'B' });
    });

    test('should check if transition is possible', () => {
      fsm.addTransition({ from: 'A', to: 'B', event: 'GO' });
      fsm.start('A');

      expect(fsm.canTransition('GO')).toBe(true);
      expect(fsm.canTransition('INVALID')).toBe(false);
    });

    test('should respect guards in canTransition', () => {
      let allowed = false;

      fsm.addTransition({
        from: 'A',
        to: 'B',
        event: 'GO',
        guard: () => allowed
      });
      fsm.start('A');

      expect(fsm.canTransition('GO')).toBe(false);

      allowed = true;
      expect(fsm.canTransition('GO')).toBe(true);
    });

    test('should return false for unstarted FSM', () => {
      fsm.addTransition({ from: 'A', to: 'B', event: 'GO' });
      expect(fsm.canTransition('GO')).toBe(false);
    });
  });

  describe('Update Method', () => {
    test('should call onUpdate on current state', () => {
      let updateCalled = false;
      let deltaReceived = 0;

      fsm.addState({
        name: 'A',
        onUpdate: (deltaTime: number) => {
          updateCalled = true;
          deltaReceived = deltaTime;
        }
      });
      fsm.start('A');

      fsm.update(16);
      expect(updateCalled).toBe(true);
      expect(deltaReceived).toBe(16);
    });

    test('should throw error when updating unstarted FSM', () => {
      expect(() => fsm.update(16)).toThrow('FSM not started. Call start() first.');
    });
  });

  describe('Property-Based: All States Reachable', () => {
    test('should verify all states are reachable from initial state', () => {
      // Create a simple graph: A -> B -> C -> D
      fsm.addState({ name: 'A' });
      fsm.addState({ name: 'B' });
      fsm.addState({ name: 'C' });
      fsm.addState({ name: 'D' });

      fsm.addTransition({ from: 'A', to: 'B', event: 'NEXT' });
      fsm.addTransition({ from: 'B', to: 'C', event: 'NEXT' });
      fsm.addTransition({ from: 'C', to: 'D', event: 'NEXT' });

      fsm.start('A');

      // Verify we can reach all states
      expect(fsm.getCurrentState()).toBe('A');

      fsm.trigger('NEXT');
      expect(fsm.getCurrentState()).toBe('B');

      fsm.trigger('NEXT');
      expect(fsm.getCurrentState()).toBe('C');

      fsm.trigger('NEXT');
      expect(fsm.getCurrentState()).toBe('D');

      // Verify history shows all states were visited
      const history = fsm.getHistory();
      expect(history).toContain('A');
      expect(history).toContain('B');
      expect(history).toContain('C');
      expect(history).toContain('D');
    });
  });

  describe('Edge Cases', () => {
    test('should handle self-transition', () => {
      let exitCalled = false;
      let enterCalled = false;

      fsm.addState({
        name: 'A',
        onEnter: () => {
          enterCalled = true;
        },
        onExit: () => {
          exitCalled = true;
        }
      });
      fsm.addTransition({ from: 'A', to: 'A', event: 'LOOP' });
      fsm.start('A');

      enterCalled = false; // Reset after start

      fsm.trigger('LOOP');
      expect(exitCalled).toBe(true);
      expect(enterCalled).toBe(true);
      expect(fsm.getCurrentState()).toBe('A');
    });

    test('should handle rapid transitions', () => {
      fsm.addState({ name: 'A' });
      fsm.addState({ name: 'B' });
      fsm.addState({ name: 'C' });

      fsm.addTransition({ from: 'A', to: 'B', event: 'GO' });
      fsm.addTransition({ from: 'B', to: 'C', event: 'GO' });
      fsm.addTransition({ from: 'C', to: 'A', event: 'GO' });

      fsm.start('A');

      // Rapid cycling
      for (let i = 0; i < 100; i++) {
        fsm.trigger('GO');
      }

      // Should cycle through states correctly
      const history = fsm.getHistory();
      expect(history.length).toBe(101); // Initial + 100 transitions
    });

    test('should handle missing optional lifecycle methods', () => {
      fsm.addState({ name: 'A' });
      fsm.addState({ name: 'B' });
      fsm.addTransition({ from: 'A', to: 'B', event: 'GO' });

      expect(() => {
        fsm.start('A');
        fsm.update(16);
        fsm.trigger('GO');
      }).not.toThrow();
    });
  });
});
