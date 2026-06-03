# AGROMIND API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently open. For production, add API key header:
```
X-API-Key: your_key_here
```

## Health Check
```http
GET /health
Response: { "status": "ok", "modules": [...], "version": "1.0.0" }
```

## Module Endpoints

### Plant Vision
- `POST /plant/analyze` — Analyze plant image for water stress
- `GET /plant/demo` — Get demo analysis without image

### Satellite
- `POST /satellite/fetch` — Fetch satellite indices for coordinates

### Rainwater
- `POST /rain/analyze` — Generate water flow map and channel design

### Voice
- `POST /voice/command` — Process voice command text
- `GET /voice/commands` — List all supported commands

### Root Scanner
- `POST /root/scan` — Simulate ultrasonic root moisture scan

### Digital Twin
- `POST /twin/simulate` — Simulate farm for given hour

### Tractor IQ
- `POST /tractor/analyze` — Analyze GPS + accelerometer data

### Transpiration
- `POST /transpiration/measure` — Calculate plant transpiration rate

## Error Responses
```json
{ "error": "Error description", "code": 400 }
```

## Rate Limits
- 100 requests/minute per IP
- Image analysis: 10 requests/minute (heavy computation)
