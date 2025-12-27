/**
 * Priority Logic - Ported from Session 4 NumPy implementation
 * Determines if lanes should switch to GREEN based on waiting vehicles and competing traffic
 */

interface PriorityDecision {
  shouldSwitch: boolean;
  reason: string;
}

/**
 * Determine if local lanes should switch to GREEN based on priority logic
 * Ported from Python NumPy implementation (traffic_gate.py)
 * 
 * @param waitingVehicles - Number of vehicles waiting in local lanes
 * @param competingTraffic - Number of vehicles in competing/cross traffic
 * @param minWaitingThreshold - Minimum waiting vehicles required (default: 3)
 * @param maxCompetingThreshold - Maximum competing traffic allowed (default: 2)
 * @param priorityRatio - Ratio threshold for priority override (default: 1.5)
 * @returns PriorityDecision with shouldSwitch boolean and reason
 */
export function isLocalLanePriority(
  waitingVehicles: number,
  competingTraffic: number,
  minWaitingThreshold: number = 3,
  maxCompetingThreshold: number = 2,
  priorityRatio: number = 1.5
): PriorityDecision {
  // Handle edge case: if competing is 0 and waiting > 0, switch to GREEN
  if (competingTraffic === 0 && waitingVehicles > 0) {
    return {
      shouldSwitch: true,
      reason: `No competing traffic and ${waitingVehicles} waiting vehicles`
    };
  }

  // Calculate ratio (handle division by zero)
  const competingSafe = competingTraffic === 0 ? 1 : competingTraffic;
  const ratio = waitingVehicles / competingSafe;

  // Condition 1: Threshold-based priority
  const meetsThreshold = waitingVehicles >= minWaitingThreshold && competingTraffic <= maxCompetingThreshold;

  // Condition 2: Ratio-based priority
  const meetsRatio = ratio >= priorityRatio;

  // Decision: switch to GREEN if any condition is met
  const shouldSwitch = meetsThreshold || meetsRatio;

  let reason: string;
  if (meetsThreshold) {
    reason = `Threshold met: ${waitingVehicles} >= ${minWaitingThreshold} waiting and ${competingTraffic} <= ${maxCompetingThreshold} competing`;
  } else if (meetsRatio) {
    reason = `Priority ratio met: ${waitingVehicles}/${competingTraffic} = ${ratio.toFixed(2)} >= ${priorityRatio}`;
  } else {
    reason = `No priority: ${waitingVehicles} waiting, ${competingTraffic} competing (ratio: ${ratio.toFixed(2)})`;
  }

  return { shouldSwitch, reason };
}

/**
 * Batch priority decisions for multiple lanes
 * @param waitingVehicles - Array of waiting vehicle counts
 * @param competingTraffic - Array of competing traffic counts
 * @returns Array of PriorityDecision objects
 */
export function batchPriorityDecisions(
  waitingVehicles: number[],
  competingTraffic: number[],
  minWaitingThreshold: number = 3,
  maxCompetingThreshold: number = 2,
  priorityRatio: number = 1.5
): PriorityDecision[] {
  if (waitingVehicles.length !== competingTraffic.length) {
    throw new Error('waitingVehicles and competingTraffic arrays must have same length');
  }

  return waitingVehicles.map((waiting, index) =>
    isLocalLanePriority(
      waiting,
      competingTraffic[index],
      minWaitingThreshold,
      maxCompetingThreshold,
      priorityRatio
    )
  );
}

