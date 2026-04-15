# GeoBackend

Emergency response backend with geospatial routing, ambulance tracking, and GPS simulation.

## New Tracking Features

### 1) OSRM route LineString for map rendering (Admin + User)

- Endpoint: `GET /api/emergency/:id/route`
- Auth: Bearer token
- Access:
    - `role_id = 1` (Super Admin): allowed
    - `role_id = 2` (Facility Admin): only for emergency requests assigned to their facility
    - `role_id = 3` (User): only for their own emergency request
- Response includes:
    - `route.line_string` (GeoJSON LineString coordinates)
    - `route.distance_meters`
    - `route.duration_seconds`

### 2) GPS simulator (3-5 seconds interval)

- Start simulator: `POST /api/tracking/simulator/start`
    - Body:
        - `emergency_request_id` (required)
        - `interval_seconds` (optional, 3 to 5)
- Stop simulator: `POST /api/tracking/simulator/stop`
    - Body:
        - `simulation_id` (required)
- Get simulator status: `GET /api/tracking/simulator/:simulationId`

The simulator uses the OSRM route and pushes points in sequence to tracking every configured interval.

### 3) Trip history persisted into `ambulance_tracking`

- Endpoint to receive GPS: `POST /api/tracking`
- Endpoint to get history: `GET /api/tracking/:ambulanceId/history?limit=50`
- History response now includes:
    - `data`: tracking points
    - `line_string`: GeoJSON LineString built from stored GPS history

## OSRM Configuration

- `OSRM_BASE_URL` (optional)
    - Default: `https://router.project-osrm.org`
- `OSRM_TIMEOUT_MS` (optional)
    - Default: `10000`

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm test -- --runInBand
```
