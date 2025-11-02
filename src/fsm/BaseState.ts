// Abstract base state
import { State } from './StateMachine';

export abstract class BaseState implements State {
  constructor(public name: string) {}

  onEnter?(): void {
    console.log(`Entered ${this.name}`);
  }

  onExit?(): void {
    console.log(`Exited ${this.name}`);
  }

  abstract onUpdate(deltaTime: number): void;
}