# Session 4 - NumPy Traffic Gate Function

This module implements a vectorized NumPy function for traffic light priority decisions.

## Function: `is_local_lane_priority`

Recreates `isLocalLanePriority` as a NumPy vector function that, given arrays of `waitingVehicles` and `competingTraffic`, returns a boolean array of "switch to GREEN" decisions.

### Installation

```bash
pip install -r requirements.txt
```

### Usage

```python
import numpy as np
from traffic_gate import is_local_lane_priority

# Example: 4 lanes of traffic
waiting_vehicles = np.array([5, 2, 8, 1])  # Vehicles waiting in local lanes
competing_traffic = np.array([1, 3, 2, 5])  # Vehicles in competing/cross traffic

# Get boolean decisions: True = switch to GREEN, False = stay RED
decisions = is_local_lane_priority(waiting_vehicles, competing_traffic)
# Result: array([True, False, True, False])

print(f"Lanes switching to GREEN: {np.sum(decisions)}/{len(decisions)}")
```

### Decision Logic

The function switches a lane to GREEN if ANY of these conditions are met:

1. **Threshold-based**: `waiting >= min_waiting_threshold` AND `competing <= max_competing_threshold`
2. **Ratio-based**: `waiting/competing >= priority_ratio` (strong priority signal)
3. **Edge case**: `competing == 0` AND `waiting > 0` (no competing traffic)

### Parameters

- `waiting_vehicles`: Array of vehicle counts waiting in local lanes
- `competing_traffic`: Array of vehicle counts in competing/cross traffic
- `min_waiting_threshold`: Minimum waiting vehicles to consider switching (default: 3)
- `max_competing_threshold`: Maximum competing traffic allowed for switching (default: 2)
- `priority_ratio`: Ratio threshold for priority override (default: 1.5)

### Batch Processing

For more detailed output:

```python
from traffic_gate import batch_priority_decisions

result = batch_priority_decisions(waiting_vehicles, competing_traffic)
# Returns dict with: decisions, waiting, competing, ratios, green_count, red_count
```

### Testing

Run the test suite:

```bash
pytest test_traffic_gate.py
```

Or run a quick validation:

```bash
python test_traffic_gate.py
```

