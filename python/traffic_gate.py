"""
Session 4 - NumPy Vector Gate Function
Recreates isLocalLanePriority as a NumPy vector function that, given arrays of
waitingVehicles and competingTraffic, returns a boolean array of "switch to GREEN" decisions.
"""
import numpy as np
from typing import Union


def is_local_lane_priority(
    waiting_vehicles: Union[np.ndarray, list],
    competing_traffic: Union[np.ndarray, list],
    min_waiting_threshold: int = 3,
    max_competing_threshold: int = 2,
    priority_ratio: float = 1.5
) -> np.ndarray:
    """
    Vectorized function to determine if local lanes should switch to GREEN.
    
    Decision logic:
    - Switch to GREEN if waiting vehicles exceed threshold AND
    - competing traffic is below threshold OR
    - waiting/competing ratio exceeds priority_ratio
    
    Args:
        waiting_vehicles: Array of vehicle counts waiting in local lanes
        competing_traffic: Array of vehicle counts in competing/cross traffic
        min_waiting_threshold: Minimum waiting vehicles required to consider switching (default: 3)
        max_competing_threshold: Maximum competing traffic allowed for switching (default: 2)
        priority_ratio: Ratio of waiting/competing that triggers priority (default: 1.5)
    
    Returns:
        Boolean numpy array: True means "switch to GREEN", False means "stay RED"
    
    Examples:
        >>> waiting = np.array([5, 2, 8, 1])
        >>> competing = np.array([1, 3, 2, 5])
        >>> is_local_lane_priority(waiting, competing)
        array([ True, False,  True, False])
    """
    # Convert inputs to numpy arrays if they aren't already
    waiting = np.asarray(waiting_vehicles, dtype=np.float64)
    competing = np.asarray(competing_traffic, dtype=np.float64)
    
    # Ensure arrays have same shape
    if waiting.shape != competing.shape:
        raise ValueError(
            f"waiting_vehicles and competing_traffic must have same shape. "
            f"Got {waiting.shape} and {competing.shape}"
        )
    
    # Handle division by zero: if competing is 0, ratio is infinity (always priority)
    competing_safe = np.where(competing == 0, 1, competing)
    ratio = waiting / competing_safe
    
    # Decision logic: switch to GREEN if:
    # 1. Waiting vehicles >= threshold AND competing <= threshold, OR
    # 2. Waiting/competing ratio >= priority_ratio (strong priority signal)
    condition1 = (waiting >= min_waiting_threshold) & (competing <= max_competing_threshold)
    condition2 = ratio >= priority_ratio
    
    # Also handle edge case: if competing is 0 and waiting > 0, switch to GREEN
    condition3 = (competing == 0) & (waiting > 0)
    
    decision = condition1 | condition2 | condition3
    
    return decision.astype(bool)


def batch_priority_decisions(
    waiting_vehicles: Union[np.ndarray, list],
    competing_traffic: Union[np.ndarray, list],
    min_waiting_threshold: int = 3,
    max_competing_threshold: int = 2,
    priority_ratio: float = 1.5
) -> dict:
    """
    Batch processing wrapper that returns decision array along with metadata.
    
    Returns:
        Dictionary with keys:
        - 'decisions': Boolean array of GREEN/True decisions
        - 'waiting': Input waiting vehicles array
        - 'competing': Input competing traffic array
        - 'ratios': Waiting/competing ratios
        - 'green_count': Number of lanes switching to GREEN
        - 'red_count': Number of lanes staying RED
    """
    decisions = is_local_lane_priority(
        waiting_vehicles, competing_traffic,
        min_waiting_threshold, max_competing_threshold, priority_ratio
    )
    
    waiting = np.asarray(waiting_vehicles)
    competing = np.asarray(competing_traffic)
    competing_safe = np.where(competing == 0, 1, competing)
    ratios = waiting / competing_safe
    
    return {
        'decisions': decisions,
        'waiting': waiting,
        'competing': competing,
        'ratios': ratios,
        'green_count': int(np.sum(decisions)),
        'red_count': int(np.sum(~decisions))
    }

