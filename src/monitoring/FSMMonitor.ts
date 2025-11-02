// FSM Monitoring and Metrics Dashboard
export interface TransitionLog {
  timestamp: number;
  from: string;
  to: string;
  event: string;
  duration?: number; // Time spent in previous state
}

export interface StateMetrics {
  stateName: string;
  enterCount: number;
  totalTimeSpent: number;
  averageTimeSpent: number;
  lastEntered: number;
  lastExited: number;
}

export interface FSMMetrics {
  totalTransitions: number;
  totalRuntime: number;
  currentState: string;
  stateMetrics: Map<string, StateMetrics>;
  transitionCounts: Map<string, number>; // "A->B" => count
  errorCount: number;
  invalidTransitionAttempts: number;
}

export class FSMMonitor {
  private transitionLog: TransitionLog[] = [];
  private stateMetrics: Map<string, StateMetrics> = new Map();
  private transitionCounts: Map<string, number> = new Map();
  private currentState: string = '';
  private stateEnterTime: number = 0;
  private startTime: number = 0;
  private errorCount: number = 0;
  private invalidTransitionAttempts: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  // Called when FSM starts
  onStart(initialState: string): void {
    this.currentState = initialState;
    this.stateEnterTime = Date.now();
    this.initializeStateMetric(initialState);
    this.stateMetrics.get(initialState)!.enterCount++;
    this.stateMetrics.get(initialState)!.lastEntered = this.stateEnterTime;
  }

  // Called on successful transition
  logTransition(from: string, to: string, event: string): void {
    const now = Date.now();
    const duration = now - this.stateEnterTime;

    // Log the transition
    this.transitionLog.push({
      timestamp: now,
      from,
      to,
      event,
      duration
    });

    // Update state metrics
    this.updateStateMetrics(from, to, duration);

    // Update transition counts
    const transitionKey = `${from}->${to}`;
    this.transitionCounts.set(
      transitionKey,
      (this.transitionCounts.get(transitionKey) || 0) + 1
    );

    // Update current state
    this.currentState = to;
    this.stateEnterTime = now;
  }

  // Called when transition attempt fails
  logInvalidTransition(from: string, event: string): void {
    this.invalidTransitionAttempts++;
    console.warn(`[Monitor] Invalid transition attempt: '${event}' from '${from}'`);
  }

  // Called when an error occurs
  logError(error: Error): void {
    this.errorCount++;
    console.error(`[Monitor] FSM Error:`, error);
  }

  private initializeStateMetric(stateName: string): void {
    if (!this.stateMetrics.has(stateName)) {
      this.stateMetrics.set(stateName, {
        stateName,
        enterCount: 0,
        totalTimeSpent: 0,
        averageTimeSpent: 0,
        lastEntered: 0,
        lastExited: 0
      });
    }
  }

  private updateStateMetrics(from: string, to: string, duration: number): void {
    // Update metrics for state we're leaving
    this.initializeStateMetric(from);
    const fromMetric = this.stateMetrics.get(from)!;
    fromMetric.totalTimeSpent += duration;
    fromMetric.averageTimeSpent = fromMetric.totalTimeSpent / fromMetric.enterCount;
    fromMetric.lastExited = Date.now();

    // Initialize metrics for state we're entering
    this.initializeStateMetric(to);
    const toMetric = this.stateMetrics.get(to)!;
    toMetric.enterCount++;
    toMetric.lastEntered = Date.now();
  }

  // Get comprehensive metrics
  getMetrics(): FSMMetrics {
    return {
      totalTransitions: this.transitionLog.length,
      totalRuntime: Date.now() - this.startTime,
      currentState: this.currentState,
      stateMetrics: new Map(this.stateMetrics),
      transitionCounts: new Map(this.transitionCounts),
      errorCount: this.errorCount,
      invalidTransitionAttempts: this.invalidTransitionAttempts
    };
  }

  // Get recent transitions (last N)
  getRecentTransitions(count: number = 10): TransitionLog[] {
    return this.transitionLog.slice(-count);
  }

  // Get all transitions
  getAllTransitions(): TransitionLog[] {
    return [...this.transitionLog];
  }

  // Get metrics for specific state
  getStateMetrics(stateName: string): StateMetrics | undefined {
    return this.stateMetrics.get(stateName);
  }

  // Calculate most common transitions
  getMostCommonTransitions(limit: number = 5): Array<{ transition: string; count: number }> {
    const sorted = Array.from(this.transitionCounts.entries())
      .map(([transition, count]) => ({ transition, count }))
      .sort((a, b) => b.count - a.count);

    return sorted.slice(0, limit);
  }

  // Calculate average time in each state
  getAverageTimeInStates(): Map<string, number> {
    const averages = new Map<string, number>();

    this.stateMetrics.forEach((metric, stateName) => {
      averages.set(stateName, metric.averageTimeSpent);
    });

    return averages;
  }

  // Get state distribution (percentage of time spent in each state)
  getStateDistribution(): Map<string, number> {
    const totalTime = Date.now() - this.startTime;
    const distribution = new Map<string, number>();

    this.stateMetrics.forEach((metric, stateName) => {
      const percentage = (metric.totalTimeSpent / totalTime) * 100;
      distribution.set(stateName, percentage);
    });

    return distribution;
  }

  // Export metrics as JSON
  exportMetrics(): string {
    const metrics = this.getMetrics();

    return JSON.stringify(
      {
        summary: {
          totalTransitions: metrics.totalTransitions,
          totalRuntime: metrics.totalRuntime,
          currentState: metrics.currentState,
          errorCount: metrics.errorCount,
          invalidTransitionAttempts: metrics.invalidTransitionAttempts
        },
        states: Array.from(metrics.stateMetrics.values()),
        transitions: this.getMostCommonTransitions(10),
        stateDistribution: Object.fromEntries(this.getStateDistribution()),
        recentActivity: this.getRecentTransitions(20)
      },
      null,
      2
    );
  }

  // Generate HTML dashboard
  generateDashboard(): string {
    const metrics = this.getMetrics();
    const mostCommon = this.getMostCommonTransitions(5);
    const stateDistribution = this.getStateDistribution();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FSM Monitoring Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    h1 {
      text-align: center;
      margin-bottom: 30px;
      font-size: 2.5rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .metric-card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }

    .metric-card h3 {
      color: #ffeb3b;
      margin-bottom: 10px;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .metric-label {
      font-size: 0.85rem;
      opacity: 0.8;
    }

    .table-container {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      background: rgba(255,255,255,0.2);
      padding: 12px;
      text-align: left;
      font-weight: bold;
      border-bottom: 2px solid rgba(255,255,255,0.3);
    }

    td {
      padding: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    tr:hover {
      background: rgba(255,255,255,0.05);
    }

    .progress-bar {
      background: rgba(0,0,0,0.3);
      height: 20px;
      border-radius: 10px;
      overflow: hidden;
      margin-top: 5px;
    }

    .progress-fill {
      background: linear-gradient(90deg, #4CAF50, #8BC34A);
      height: 100%;
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 10px;
      font-size: 0.75rem;
    }

    .current-state {
      background: linear-gradient(45deg, #ff6b6b, #ee5a6f);
      padding: 15px 30px;
      border-radius: 25px;
      font-size: 1.2rem;
      font-weight: bold;
      text-align: center;
      margin-bottom: 30px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 FSM Monitoring Dashboard</h1>

    <div class="current-state">
      Current State: <span>${metrics.currentState}</span>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Total Transitions</h3>
        <div class="metric-value">${metrics.totalTransitions}</div>
        <div class="metric-label">State changes</div>
      </div>

      <div class="metric-card">
        <h3>Runtime</h3>
        <div class="metric-value">${Math.floor(metrics.totalRuntime / 1000)}</div>
        <div class="metric-label">Seconds</div>
      </div>

      <div class="metric-card">
        <h3>Error Count</h3>
        <div class="metric-value">${metrics.errorCount}</div>
        <div class="metric-label">Errors encountered</div>
      </div>

      <div class="metric-card">
        <h3>Invalid Attempts</h3>
        <div class="metric-value">${metrics.invalidTransitionAttempts}</div>
        <div class="metric-label">Failed transitions</div>
      </div>
    </div>

    <div class="table-container">
      <h2>🔝 Most Common Transitions</h2>
      <table>
        <thead>
          <tr>
            <th>Transition</th>
            <th>Count</th>
            <th>Frequency</th>
          </tr>
        </thead>
        <tbody>
          ${mostCommon
            .map(
              (t) => `
            <tr>
              <td>${t.transition}</td>
              <td>${t.count}</td>
              <td>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${
                    (t.count / metrics.totalTransitions) * 100
                  }%">
                    ${((t.count / metrics.totalTransitions) * 100).toFixed(1)}%
                  </div>
                </div>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <div class="table-container">
      <h2>📈 State Distribution</h2>
      <table>
        <thead>
          <tr>
            <th>State</th>
            <th>Time Spent (%)</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from(stateDistribution.entries())
            .map(
              ([state, percentage]) => `
            <tr>
              <td>${state}</td>
              <td>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${percentage}%">
                    ${percentage.toFixed(1)}%
                  </div>
                </div>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <div class="table-container">
      <h2>📜 Recent Transitions</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>From</th>
            <th>To</th>
            <th>Event</th>
            <th>Duration (ms)</th>
          </tr>
        </thead>
        <tbody>
          ${this.getRecentTransitions(15)
            .map(
              (t) => `
            <tr>
              <td>${new Date(t.timestamp).toLocaleTimeString()}</td>
              <td>${t.from}</td>
              <td>${t.to}</td>
              <td>${t.event}</td>
              <td>${t.duration || 'N/A'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Clear all monitoring data
  reset(): void {
    this.transitionLog = [];
    this.stateMetrics.clear();
    this.transitionCounts.clear();
    this.currentState = '';
    this.stateEnterTime = 0;
    this.startTime = Date.now();
    this.errorCount = 0;
    this.invalidTransitionAttempts = 0;
  }
}
