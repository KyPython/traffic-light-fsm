// Traffic Light FSM Demo - Browser Version
// This is a simplified browser-compatible version of the TypeScript FSM

// State interface implementation
class State {
    constructor(name) {
        this.name = name;
    }
    
    onEnter() {
        console.log(`Entered ${this.name}`);
    }
    
    onExit() {
        console.log(`Exited ${this.name}`);
    }
    
    onUpdate(deltaTime) {
        // Override in subclasses
    }
}

// Main FSM Engine
class StateMachine {
    constructor(debug = false) {
        this.currentState = null;
        this.states = new Map();
        this.transitions = [];
        this.history = [];
        this.debug = debug;
    }

    addState(state) {
        if (this.states.has(state.name)) {
            throw new Error(`State '${state.name}' already exists`);
        }
        this.states.set(state.name, state);
        this.log(`Added state: ${state.name}`);
    }

    addTransition(transition) {
        if (transition.from !== '*' && !this.states.has(transition.from)) {
            throw new Error(`Source state '${transition.from}' does not exist`);
        }
        if (!this.states.has(transition.to)) {
            throw new Error(`Target state '${transition.to}' does not exist`);
        }
        
        this.transitions.push(transition);
        this.log(`Added transition: ${transition.from} --[${transition.event}]--> ${transition.to}`);
    }

    start(stateName) {
        const state = this.states.get(stateName);
        if (!state) {
            throw new Error(`Cannot start FSM: State '${stateName}' not found`);
        }

        if (this.currentState) {
            throw new Error('FSM is already started. Use trigger() to change states.');
        }

        this.currentState = state;
        this.history.push(stateName);
        this.log(`FSM started in state: ${stateName}`);
        
        if (state.onEnter) {
            state.onEnter();
        }
    }

    trigger(event) {
        if (!this.currentState) {
            throw new Error('FSM not started. Call start() first.');
        }

        const currentStateName = this.currentState.name;
        this.log(`Triggering event '${event}' from state '${currentStateName}'`);

        const transition = this.transitions.find(t => 
            (t.from === currentStateName || t.from === '*') && 
            t.event === event &&
            (!t.guard || t.guard())
        );

        if (!transition) {
            this.log(`No valid transition found for event '${event}' from state '${currentStateName}'`);
            return false;
        }

        this.transitionTo(transition.to, transition.action);
        return true;
    }

    transitionTo(stateName, action) {
        const newState = this.states.get(stateName);
        if (!newState) {
            throw new Error(`Target state '${stateName}' not found`);
        }

        const oldStateName = this.currentState?.name;
        this.log(`Transitioning from '${oldStateName}' to '${stateName}'`);

        if (this.currentState && this.currentState.onExit) {
            this.currentState.onExit();
        }

        if (action) {
            action();
        }

        this.currentState = newState;
        this.history.push(stateName);

        if (newState.onEnter) {
            newState.onEnter();
        }
    }

    update(deltaTime) {
        if (!this.currentState) {
            throw new Error('FSM not started. Call start() first.');
        }

        if (this.currentState.onUpdate) {
            this.currentState.onUpdate(deltaTime);
        }
    }

    getCurrentState() {
        if (!this.currentState) {
            throw new Error('FSM not started. Call start() first.');
        }
        return this.currentState.name;
    }

    getHistory() {
        return [...this.history];
    }

    canTransition(event) {
        if (!this.currentState) {
            return false;
        }

        const currentStateName = this.currentState.name;
        
        const transition = this.transitions.find(t => 
            (t.from === currentStateName || t.from === '*') && 
            t.event === event &&
            (!t.guard || t.guard())
        );

        return transition !== undefined;
    }

    log(message) {
        if (this.debug) {
            console.log(`[FSM] ${message}`);
        }
    }
}

// Traffic Light States
class RedLightState extends State {
    constructor(fsm) {
        super('RED');
        this.fsm = fsm;
        this.timer = 0;
        this.duration = 30000; // 30 seconds
    }

    onEnter() {
        super.onEnter();
        this.timer = 0;
        console.log(`🔴 RED LIGHT - Duration: ${this.duration / 1000}s`);
    }

    onUpdate(deltaTime) {
        this.timer += deltaTime;
        
        if (this.timer >= this.duration) {
            console.log(`🔴 RED LIGHT timer expired (${this.timer}ms >= ${this.duration}ms)`);
            this.fsm.trigger('TIMER_EXPIRED');
        }
    }

    getTimeRemaining() {
        return Math.max(0, this.duration - this.timer);
    }
}

class GreenLightState extends State {
    constructor(fsm) {
        super('GREEN');
        this.fsm = fsm;
        this.timer = 0;
        this.duration = 25000; // 25 seconds
    }

    onEnter() {
        super.onEnter();
        this.timer = 0;
        console.log(`🟢 GREEN LIGHT - Duration: ${this.duration / 1000}s`);
    }

    onUpdate(deltaTime) {
        this.timer += deltaTime;
        
        if (this.timer >= this.duration) {
            console.log(`🟢 GREEN LIGHT timer expired (${this.timer}ms >= ${this.duration}ms)`);
            this.fsm.trigger('TIMER_EXPIRED');
        }
    }

    getTimeRemaining() {
        return Math.max(0, this.duration - this.timer);
    }
}

class YellowLightState extends State {
    constructor(fsm) {
        super('YELLOW');
        this.fsm = fsm;
        this.timer = 0;
        this.duration = 5000; // 5 seconds
    }

    onEnter() {
        super.onEnter();
        this.timer = 0;
        console.log(`🟡 YELLOW LIGHT - Duration: ${this.duration / 1000}s`);
    }

    onUpdate(deltaTime) {
        this.timer += deltaTime;
        
        if (this.timer >= this.duration) {
            console.log(`🟡 YELLOW LIGHT timer expired (${this.timer}ms >= ${this.duration}ms)`);
            this.fsm.trigger('TIMER_EXPIRED');
        }
    }

    getTimeRemaining() {
        return Math.max(0, this.duration - this.timer);
    }
}

// Traffic Light Controller
class TrafficLightController {
    constructor(debug = false) {
        this.fsm = new StateMachine(debug);
        this.redState = new RedLightState(this.fsm);
        this.greenState = new GreenLightState(this.fsm);
        this.yellowState = new YellowLightState(this.fsm);
        this.isRunning = false;
        this.cycleCount = 0;
        this.lastState = null;

        this.setupStatesAndTransitions();
    }

    setupStatesAndTransitions() {
        this.fsm.addState(this.redState);
        this.fsm.addState(this.greenState);
        this.fsm.addState(this.yellowState);

        const transitions = [
            { from: 'RED', to: 'GREEN', event: 'TIMER_EXPIRED', action: () => this.onStateChange() },
            { from: 'GREEN', to: 'YELLOW', event: 'TIMER_EXPIRED', action: () => this.onStateChange() },
            { from: 'YELLOW', to: 'RED', event: 'TIMER_EXPIRED', action: () => this.onCycleComplete() },
            
            { from: '*', to: 'RED', event: 'EMERGENCY_OVERRIDE', action: () => this.onEmergencyOverride() },
            { from: '*', to: 'GREEN', event: 'FORCE_GREEN', action: () => this.onManualOverride() },
            { from: '*', to: 'YELLOW', event: 'FORCE_YELLOW', action: () => this.onManualOverride() },
            { from: '*', to: 'RED', event: 'FORCE_RED', action: () => this.onManualOverride() }
        ];

        transitions.forEach(transition => this.fsm.addTransition(transition));
    }

    onStateChange() {
        // Called on normal state transitions
    }

    onCycleComplete() {
        this.cycleCount++;
    }

    onEmergencyOverride() {
        console.log('🚨 EMERGENCY OVERRIDE ACTIVATED');
    }

    onManualOverride() {
        console.log('🔧 Manual override activated');
    }

    start() {
        if (this.isRunning) {
            throw new Error('Traffic light controller is already running');
        }

        console.log('🚦 Starting Traffic Light Controller...');
        this.fsm.start('RED');
        this.isRunning = true;
    }

    stop() {
        console.log('🚦 Stopping Traffic Light Controller...');
        this.isRunning = false;
    }

    reset() {
        this.stop();
        this.cycleCount = 0;
        this.fsm = new StateMachine(true);
        this.redState = new RedLightState(this.fsm);
        this.greenState = new GreenLightState(this.fsm);
        this.yellowState = new YellowLightState(this.fsm);
        this.setupStatesAndTransitions();
    }

    update(deltaTime) {
        if (!this.isRunning) {
            return;
        }

        this.fsm.update(deltaTime);
    }

    emergencyOverride() {
        if (!this.isRunning) {
            return false;
        }
        return this.fsm.trigger('EMERGENCY_OVERRIDE');
    }

    forceGreen() {
        return this.isRunning && this.fsm.trigger('FORCE_GREEN');
    }

    forceYellow() {
        return this.isRunning && this.fsm.trigger('FORCE_YELLOW');
    }

    forceRed() {
        return this.isRunning && this.fsm.trigger('FORCE_RED');
    }

    getCurrentState() {
        try {
            return this.fsm.getCurrentState();
        } catch (error) {
            return 'NOT_STARTED';
        }
    }

    getHistory() {
        return this.fsm.getHistory();
    }

    getCurrentStateTimer() {
        try {
            const currentState = this.fsm.getCurrentState();
            switch (currentState) {
                case 'RED':
                    return this.redState.getTimeRemaining();
                case 'GREEN':
                    return this.greenState.getTimeRemaining();
                case 'YELLOW':
                    return this.yellowState.getTimeRemaining();
                default:
                    return 0;
            }
        } catch (error) {
            return 0;
        }
    }

    getCycleCount() {
        return this.cycleCount;
    }

    isOperational() {
        return this.isRunning;
    }
}

// Demo Application
class TrafficLightDemo {
    constructor() {
        this.controller = new TrafficLightController(true);
        this.lastTime = performance.now();
        this.animationId = null;
        this.logEntries = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.hijackConsoleLog();
    }

    initializeElements() {
        this.elements = {
            redLight: document.getElementById('redLight'),
            yellowLight: document.getElementById('yellowLight'),
            greenLight: document.getElementById('greenLight'),
            currentState: document.getElementById('currentState'),
            isRunning: document.getElementById('isRunning'),
            cycleCount: document.getElementById('cycleCount'),
            timerDisplay: document.getElementById('timerDisplay'),
            logContainer: document.getElementById('logContainer'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            resetBtn: document.getElementById('resetBtn'),
            forceRedBtn: document.getElementById('forceRedBtn'),
            forceYellowBtn: document.getElementById('forceYellowBtn'),
            forceGreenBtn: document.getElementById('forceGreenBtn'),
            emergencyBtn: document.getElementById('emergencyBtn')
        };
    }

    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.stopBtn.addEventListener('click', () => this.stop());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        this.elements.forceRedBtn.addEventListener('click', () => this.controller.forceRed());
        this.elements.forceYellowBtn.addEventListener('click', () => this.controller.forceYellow());
        this.elements.forceGreenBtn.addEventListener('click', () => this.controller.forceGreen());
        this.elements.emergencyBtn.addEventListener('click', () => this.controller.emergencyOverride());
    }

    hijackConsoleLog() {
        const originalLog = console.log;
        console.log = (...args) => {
            originalLog.apply(console, args);
            this.addLogEntry(args.join(' '));
        };
    }

    addLogEntry(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.logEntries.push(`[${timestamp}] ${message}`);
        
        // Keep only last 50 entries
        if (this.logEntries.length > 50) {
            this.logEntries.shift();
        }
        
        this.updateLogDisplay();
    }

    updateLogDisplay() {
        this.elements.logContainer.innerHTML = this.logEntries
            .map(entry => `<div class="log-entry">${entry}</div>`)
            .join('');
        this.elements.logContainer.scrollTop = this.elements.logContainer.scrollHeight;
    }

    start() {
        try {
            this.controller.start();
            this.startAnimation();
        } catch (error) {
            console.log(`Error starting: ${error.message}`);
        }
    }

    stop() {
        this.controller.stop();
        this.stopAnimation();
    }

    reset() {
        this.controller.reset();
        this.stopAnimation();
        this.updateDisplay();
    }

    startAnimation() {
        if (this.animationId) return;
        
        const animate = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.controller.update(deltaTime);
            this.updateDisplay();
            
            if (this.controller.isOperational()) {
                this.animationId = requestAnimationFrame(animate);
            }
        };
        
        this.animationId = requestAnimationFrame(animate);
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    updateDisplay() {
        const currentState = this.controller.getCurrentState();
        const isRunning = this.controller.isOperational();
        const cycleCount = this.controller.getCycleCount();
        const timeRemaining = this.controller.getCurrentStateTimer();

        // Update lights
        this.elements.redLight.classList.toggle('active', currentState === 'RED');
        this.elements.yellowLight.classList.toggle('active', currentState === 'YELLOW');
        this.elements.greenLight.classList.toggle('active', currentState === 'GREEN');

        // Update status
        this.elements.currentState.textContent = currentState;
        this.elements.isRunning.textContent = isRunning ? '✅' : '❌';
        this.elements.cycleCount.textContent = cycleCount;

        // Update timer
        if (isRunning && timeRemaining > 0) {
            const seconds = Math.ceil(timeRemaining / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            this.elements.timerDisplay.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            this.elements.timerDisplay.textContent = '--:--';
        }

        // Update button states
        this.elements.startBtn.disabled = isRunning;
        this.elements.stopBtn.disabled = !isRunning;
        this.elements.forceRedBtn.disabled = !isRunning;
        this.elements.forceYellowBtn.disabled = !isRunning;
        this.elements.forceGreenBtn.disabled = !isRunning;
        this.elements.emergencyBtn.disabled = !isRunning;
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.demo = new TrafficLightDemo();
    console.log('🚦 Traffic Light FSM Demo loaded!');
    console.log('Click "Start" to begin the demonstration.');
});