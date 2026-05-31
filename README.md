# Nerve — AI-assisted Non-Invasive Pipe Monitoring Platform

> Sensor fusion-based anomaly detection for municipal infrastructure

## Overview

Nerve is a smart infrastructure monitoring platform for municipalities, water/sewage authorities, and utility organizations. It uses a **non-invasive sensor box** attached to the outside surface of underground or exposed water/sewage pipes. The device **does not drill, cut, open, or damage the pipe**.

### Real Data Flow

```
Sensors → ESP32 → Wi-Fi HTTP POST JSON → Node.js Backend → Database → Risk Engine → Socket.io → React Dashboard
```

## Architecture

| Component | Technology | Port |
|-----------|-----------|------|
| Backend API | Node.js + Express + TypeScript | `5000` |
| Frontend | React + Vite + TypeScript + Tailwind | `5173` |
| Real-time | Socket.io | via `5000` |
| Database | lowdb (JSON-file) | — |
| Hardware | ESP32 + ADXL345 + DHT22 + Mic | — |

## Quick Start

### 1. Start Backend

```bash
cd server
npm install
npm run seed    # Seed demo data (6 devices, 10 reports, alerts)
npm run dev     # Starts on http://0.0.0.0:5000
```

### 2. Start Frontend

```bash
cd client
npm install
npm run dev     # Starts on http://localhost:5173
```

### 3. Test the API

```bash
# Health check
curl http://localhost:5000/health

# Get dashboard summary
curl http://localhost:5000/api/dashboard-summary

# Get all devices
curl http://localhost:5000/api/devices

# Send simulated sensor data
curl -X POST http://localhost:5000/api/simulate-reading \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"NERVE-NAR-001","scenario":"critical_vibration"}'
```

## Hardware Setup (ESP32)

### Sensor Connections

| Sensor | Pin | ESP32 GPIO |
|--------|-----|-----------|
| ADXL345 SDA | SDA | GPIO25 |
| ADXL345 SCL | SCL | GPIO26 |
| DHT22 DATA | DATA | GPIO15 |
| Microphone AO | AO | GPIO34 |
| Status LED | + | GPIO2 |

### Wiring Diagram

```
ESP32 DevKit v1
┌──────────────┐
│              │
│   GPIO25 ──── ADXL345 SDA
│   GPIO26 ──── ADXL345 SCL
│   3.3V   ──── ADXL345 VCC + DHT22 VCC
│   GND    ──── ADXL345 GND + DHT22 GND + MIC GND
│   GPIO15 ──── DHT22 DATA
│   GPIO34 ──── Microphone AO
│   GPIO2  ──── LED (+ resistor to GND)
│              │
└──────────────┘
```

### Setup Steps

1. **Connect sensors** to ESP32 according to the wiring diagram above
2. **Open Arduino IDE** and install required libraries:
   - `ArduinoJson` by Benoit Blanchon
   - `DHT sensor library` by Adafruit
   - `Adafruit Unified Sensor` by Adafruit
3. **Open** `arduino/nerve_esp32_full_sensor_code.ino`
4. **Edit** the configuration section:
   ```cpp
   const char* WIFI_SSID     = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* SERVER_URL    = "http://192.168.1.35:5000/api/sensor-data";
   const char* DEVICE_ID     = "NERVE-NAR-001";
   ```
5. **Find your laptop's local IP:**
   - Windows: `ipconfig` → look for IPv4 Address
   - macOS: `ifconfig en0` → look for inet
   - Linux: `ip addr show` or `hostname -I`
6. **Put laptop IP** into `SERVER_URL` (NOT localhost!)
7. **Connect** ESP32 and laptop to the **same Wi-Fi network**
8. **Upload** the code to ESP32 via Arduino IDE
9. **Open Serial Monitor** (115200 baud) and confirm sensor readings
10. **Start backend** (`npm run dev` in `/server`)
11. **Watch Serial Monitor** for `HTTP Response code: 200`
12. **Start frontend** (`npm run dev` in `/client`)
13. **See real data live** in the dashboard!

### Important Notes

- **USB** is only needed for uploading code, Serial Monitor debugging, and power (if no battery)
- During real operation, ESP32 can send data through **Wi-Fi without USB** if powered by battery/power bank
- Data is **not stored** in Arduino IDE — it is stored in the backend database
- Real flow: `Sensor → ESP32 → Wi-Fi → Backend → Database → Socket.io → APP`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| HTTP response code **-1** | Backend not running, wrong IP, or firewall blocking port |
| Wrong IP | Use your laptop's LOCAL IP, not `localhost` or `127.0.0.1` |
| Backend not running | Run `cd server && npm run dev` first |
| Firewall | Allow port 5000 through your OS firewall |
| ESP32 and laptop not on same WiFi | Both must be on the same network |
| Backend not listening on 0.0.0.0 | Server is configured to listen on `0.0.0.0:5000` |
| `localhost` used incorrectly | ESP32 cannot use `localhost` — it refers to the ESP32 itself |
| DHT read failed | Check wiring, pull-up resistor on DATA pin, use 10kΩ |
| ADXL345 not detected | Check I2C wiring (SDA=25, SCL=26), verify I2C address (0x53) |
| Microphone values not changing | Check analog pin (GPIO34), ensure mic has proper power |
| No sensor data in dashboard | Check browser console for Socket.io connection errors |

## Sensors Used

| Sensor | Measures | Fields |
|--------|----------|--------|
| ADXL345 | Acceleration, Vibration | accelX, accelY, accelZ, rawVibration, vibrationLevel, baseline |
| DHT22 | Temperature, Humidity | temperature, humidity |
| Microphone | Sound/Acoustic | acousticLevel, micPeakToPeak, soundStatus |
| ESP32 | Connectivity | battery (mock), signalStrength (WiFi RSSI) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sensor-data` | Receive ESP32 or simulation data |
| POST | `/api/simulate-reading` | Send preset simulation scenario |
| GET | `/api/devices` | List all devices |
| GET | `/api/devices/:id` | Get single device |
| GET | `/api/devices/:id/readings` | Get historical readings |
| POST | `/api/devices/:id/offline` | Mark device offline |
| POST | `/api/devices/:id/online` | Mark device online |
| GET | `/api/dashboard-summary` | Dashboard metrics |
| GET | `/api/map-data` | Map markers and zones |
| GET | `/api/issues` | List issues |
| POST | `/api/issues/:id/assign` | Assign issue |
| POST | `/api/issues/:id/status` | Update issue status |
| POST | `/api/reports` | Create citizen report |
| GET | `/api/reports/:code` | Track report |

## Risk Engine

The risk engine uses sensor fusion-based anomaly detection:

- **Vibration** (40% weight): 0–100 scale from ADXL345
- **Acoustic** (25% weight): 0–100 scale from microphone
- **Temperature** (15% weight): Freeze risk detection
- **Humidity** (10% weight): Moisture risk
- **Battery** (5% penalty): Low battery warning
- **Signal** (5% penalty): Weak WiFi warning

Score ranges:
- **0–39**: SAFE (green)
- **40–69**: WARNING (yellow/orange)
- **70–100**: CRITICAL (red)

## MVP Limitations

- ❌ No direct water pressure sensor in current MVP
- ❌ No direct water leak sensor in current MVP
- ❌ No claim of direct internal pipe flow measurement
- ❌ No GPS underground (coordinates are pre-configured)
- ❌ AI not trained on real municipal data yet
- ✅ AI-assisted prototype risk engine
- ✅ Sensor fusion-based anomaly detection
- ✅ Non-invasive external pipe monitoring box
- ✅ Real pilot data will improve the AI model
- ✅ Pressure and leak detection can be added as industrial sensor modules

## Project Structure

```
/client          — React + Vite + TypeScript frontend
  /src/pages     — Dashboard, Map, Devices, Detail, Simulation, etc.
  /src/services  — API and Socket.io clients
  /src/store     — Zustand state management
  /src/components — Sidebar, TopBar, shared UI

/server          — Node.js + Express + TypeScript backend
  /src/routes    — API route handlers
  /src/services  — Risk engine
  /src/models    — Database schema types
  /src/seed      — Demo data seeder
  /src/socket    — Socket.io handler

/arduino         — ESP32 sensor code
  nerve_esp32_full_sensor_code.ino
```

## License

MIT — Built for hackathon demonstration purposes.
