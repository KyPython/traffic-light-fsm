# Session 5 - REST API for Traffic Light FSM

REST API endpoint `POST /next-state` that computes the next state for a traffic light controller.

## Installation

```bash
cd api
npm install
```

## Development

```bash
# Run with ts-node (no build needed)
npm run dev

# Or build and run
npm run build
npm start

# Watch mode
npm run watch
```

The server runs on `http://localhost:3000` by default (or PORT environment variable).

## API Endpoints

### POST /next-state

Determines the next state based on current state, elapsed time, and optional traffic data.

**Request Body:**
```json
{
  "currentState": "RED" | "GREEN" | "YELLOW",
  "secondsElapsed": 35,
  "waitingVehicles": 5,        // Optional
  "competingTraffic": 2        // Optional
}
```

**Response:**
```json
{
  "nextState": "GREEN",
  "transitioned": true,
  "reason": "Timer expired: 35s >= 30s. Normal cycle transition."
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/next-state \
  -H "Content-Type: application/json" \
  -d '{
    "currentState": "RED",
    "secondsElapsed": 30,
    "waitingVehicles": 5,
    "competingTraffic": 2
  }'
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "traffic-light-fsm-api"
}
```

### GET /states

Returns available states, durations, and transitions.

**Response:**
```json
{
  "states": ["RED", "GREEN", "YELLOW"],
  "durations": {
    "RED": 30,
    "GREEN": 25,
    "YELLOW": 5
  },
  "transitions": {
    "RED": "GREEN",
    "GREEN": "YELLOW",
    "YELLOW": "RED"
  }
}
```

## State Logic

The API matches the logic from `TrafficLightController.ts`:

- **State Durations:**
  - RED: 30 seconds
  - GREEN: 25 seconds
  - YELLOW: 5 seconds

- **Transitions:**
  - RED → GREEN (on timer expiry)
  - GREEN → YELLOW (on timer expiry)
  - YELLOW → RED (on timer expiry)

- **Optional Priority Logic:**
  - Uses `waitingVehicles` and `competingTraffic` for priority decisions
  - Can integrate with the NumPy gate function from Session 4

## Error Handling

Returns appropriate HTTP status codes:
- `400`: Bad request (missing/invalid fields)
- `500`: Internal server error

