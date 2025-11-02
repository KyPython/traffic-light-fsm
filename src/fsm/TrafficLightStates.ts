// Concrete states for traffic light
import { StateMachine } from './StateMachine';
import { BaseState } from './BaseState';

export class RedLightState extends BaseState {
  private timer: number = 0;
  private readonly duration: number = 30000; // 30 seconds

  constructor(private fsm: StateMachine) {
    super('RED');
  }

  onEnter(): void {
    super.onEnter();
    this.timer = 0;
    console.log(`🔴 RED LIGHT - Duration: ${this.duration / 1000}s`);
  }

  onUpdate(deltaTime: number): void {
    this.timer += deltaTime;
    
    if (this.timer >= this.duration) {
      console.log(`🔴 RED LIGHT timer expired (${this.timer}ms >= ${this.duration}ms)`);
      this.fsm.trigger('TIMER_EXPIRED');
    }
  }
}

export class GreenLightState extends BaseState {
  private timer: number = 0;
  private readonly duration: number = 25000; // 25 seconds

  constructor(private fsm: StateMachine) {
    super('GREEN');
  }

  onEnter(): void {
    super.onEnter();
    this.timer = 0;
    console.log(`🟢 GREEN LIGHT - Duration: ${this.duration / 1000}s`);
  }

  onUpdate(deltaTime: number): void {
    this.timer += deltaTime;
    
    if (this.timer >= this.duration) {
      console.log(`🟢 GREEN LIGHT timer expired (${this.timer}ms >= ${this.duration}ms)`);
      this.fsm.trigger('TIMER_EXPIRED');
    }
  }
}

export class YellowLightState extends BaseState {
  private timer: number = 0;
  private readonly duration: number = 5000; // 5 seconds

  constructor(private fsm: StateMachine) {
    super('YELLOW');
  }

  onEnter(): void {
    super.onEnter();
    this.timer = 0;
    console.log(`🟡 YELLOW LIGHT - Duration: ${this.duration / 1000}s`);
  }

  onUpdate(deltaTime: number): void {
    this.timer += deltaTime;
    
    if (this.timer >= this.duration) {
      console.log(`🟡 YELLOW LIGHT timer expired (${this.timer}ms >= ${this.duration}ms)`);
      this.fsm.trigger('TIMER_EXPIRED');
    }
  }
}