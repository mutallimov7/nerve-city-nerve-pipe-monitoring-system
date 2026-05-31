/*
 * Nerve ESP32 Full Sensor Code
 * ──────────────────────────────
 * AI-assisted non-invasive pipe monitoring platform
 * 
 * Hardware:
 *   ESP32 DevKit v1
 *   ADXL345 accelerometer (I2C: SDA=GPIO25, SCL=GPIO26)
 *   DHT22 temperature/humidity sensor (DATA=GPIO15)
 *   Microphone analog sensor (AO=GPIO34)
 *   Status LED (GPIO2)
 * 
 * Data flow:
 *   Sensors → ESP32 → Wi-Fi HTTP POST JSON → Backend → Database → Socket.io → React Dashboard
 * 
 * IMPORTANT:
 *   Replace WIFI_SSID, WIFI_PASSWORD, and SERVER_URL with your actual values.
 *   SERVER_URL must use your laptop's LOCAL IP address (e.g. 192.168.1.35),
 *   NOT "localhost" — because ESP32 is a separate device on the network.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>

// ─── DHT Library ───────────────────────────────────────────
// Install "DHT sensor library" by Adafruit from Library Manager
#include <DHT.h>

// ═══════════════════════════════════════════════════════════
//  USER CONFIGURATION — CHANGE THESE VALUES
// ═══════════════════════════════════════════════════════════
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Use your laptop's local IP address, NOT localhost!
// Find it: Windows → ipconfig | macOS/Linux → ifconfig or ip addr
// Example: "http://192.168.1.35:5000/api/sensor-data"
const char* SERVER_URL    = "http://192.168.1.35:5000/api/sensor-data";

const char* DEVICE_ID     = "NERVE-NAR-001";
// ═══════════════════════════════════════════════════════════

// ─── Pin Definitions ───────────────────────────────────────
#define ADXL_SDA    25
#define ADXL_SCL    26
#define DHT_PIN     15
#define MIC_PIN     34
#define LED_PIN     2

// ─── ADXL345 I2C Address ──────────────────────────────────
#define ADXL345_ADDR  0x53
#define ADXL345_POWER_CTL  0x2D
#define ADXL345_DATA_FORMAT 0x31
#define ADXL345_DATAX0 0x32

// ─── DHT Setup ─────────────────────────────────────────────
#define DHTTYPE DHT22  // Change to DHT11 or DHT12 if needed
DHT dht(DHT_PIN, DHTTYPE);

// ─── Timing ────────────────────────────────────────────────
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 5000; // Send every 5 seconds

// ─── Baseline for vibration ────────────────────────────────
float vibBaseline = 0.021;
int sampleCount = 0;

// ═══════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n══════════════════════════════════");
  Serial.println("  Nerve ESP32 Sensor Node v2.1");
  Serial.println("  Non-invasive pipe monitoring");
  Serial.println("══════════════════════════════════\n");

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // ─── I2C for ADXL345 ────────────────────────────────────
  Wire.begin(ADXL_SDA, ADXL_SCL);
  initADXL345();

  // ─── DHT sensor ─────────────────────────────────────────
  dht.begin();

  // ─── WiFi ───────────────────────────────────────────────
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    digitalWrite(LED_PIN, HIGH);
  } else {
    Serial.println("\n[WiFi] FAILED to connect!");
    Serial.println("[WiFi] Check SSID and password.");
  }

  Serial.print("[Server] Target: ");
  Serial.println(SERVER_URL);
  Serial.println();
}

// ═══════════════════════════════════════════════════════════
//  ADXL345 INIT
// ═══════════════════════════════════════════════════════════
void initADXL345() {
  // Set measurement mode
  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(ADXL345_POWER_CTL);
  Wire.write(0x08); // Measure bit
  byte error = Wire.endTransmission();

  if (error == 0) {
    Serial.println("[ADXL345] Initialized OK");

    // Set data format: full resolution, +/-16g
    Wire.beginTransmission(ADXL345_ADDR);
    Wire.write(ADXL345_DATA_FORMAT);
    Wire.write(0x0B);
    Wire.endTransmission();
  } else {
    Serial.print("[ADXL345] ERROR! Code: ");
    Serial.println(error);
    Serial.println("[ADXL345] Check wiring: SDA=GPIO25, SCL=GPIO26");
  }
}

// ═══════════════════════════════════════════════════════════
//  READ ADXL345
// ═══════════════════════════════════════════════════════════
void readADXL345(float &ax, float &ay, float &az) {
  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(ADXL345_DATAX0);
  Wire.endTransmission(false);
  Wire.requestFrom(ADXL345_ADDR, 6, true);

  if (Wire.available() >= 6) {
    int16_t x = Wire.read() | (Wire.read() << 8);
    int16_t y = Wire.read() | (Wire.read() << 8);
    int16_t z = Wire.read() | (Wire.read() << 8);

    // Convert to g (ADXL345 scale factor: 3.9mg/LSB at full resolution)
    ax = x * 0.0039;
    ay = y * 0.0039;
    az = z * 0.0039;
  } else {
    ax = 0; ay = 0; az = 9.81;
    Serial.println("[ADXL345] Read failed — using defaults");
  }
}

// ═══════════════════════════════════════════════════════════
//  READ MICROPHONE (peak-to-peak sampling)
// ═══════════════════════════════════════════════════════════
void readMicrophone(int &peakToPeak, float &acousticLevel) {
  unsigned long startTime = micros();
  int minVal = 4095;
  int maxVal = 0;

  // Sample for 50ms
  while (micros() - startTime < 50000) {
    int sample = analogRead(MIC_PIN);
    if (sample > maxVal) maxVal = sample;
    if (sample < minVal) minVal = sample;
  }

  peakToPeak = maxVal - minVal;
  // Map to 0-100 acoustic level
  acousticLevel = map(peakToPeak, 0, 4095, 0, 100);
  acousticLevel = constrain(acousticLevel, 0, 100);
}

// ═══════════════════════════════════════════════════════════
//  CALCULATE VIBRATION FROM ACCELEROMETER
// ═══════════════════════════════════════════════════════════
float calculateVibration(float ax, float ay, float az) {
  // Remove gravity component (assume static gravity ~9.81 on Z)
  float rawVib = sqrt(ax * ax + ay * ay + (az - 9.81) * (az - 9.81));
  return rawVib;
}

float calculateVibrationLevel(float rawVib) {
  // Map raw vibration to 0-100 scale
  float level = (rawVib / 0.15) * 100.0;
  return constrain(level, 0, 100);
}

// ═══════════════════════════════════════════════════════════
//  DETERMINE STATUS, MODE, ACTIVITY
// ═══════════════════════════════════════════════════════════
String determineStatus(float riskScore) {
  if (riskScore < 40) return "SAFE";
  if (riskScore < 70) return "WARNING";
  return "CRITICAL";
}

String determineMode(float vibLevel, float acLevel, float temp, float hum) {
  bool highVib = vibLevel >= 60;
  bool highAc = acLevel >= 50;
  bool freeze = temp <= 2;
  bool highHum = hum >= 70;

  if (highVib && highAc) return "Mechanical + Acoustic Anomaly Mode";
  if (highVib) return "Mechanical Anomaly Mode";
  if (highAc) return "Acoustic Anomaly Mode";
  if (freeze && highHum) return "Combined Critical Risk Mode";
  if (freeze) return "Freeze/Ice Risk Mode";
  if (highHum) return "Humidity Risk Mode";
  return "Normal Mode";
}

String determineActivity(float riskScore) {
  if (riskScore <= 30) return "Low Activity";
  if (riskScore <= 60) return "Medium Activity";
  if (riskScore <= 80) return "High Activity";
  return "Abnormal Activity";
}

String determineSoundStatus(float acLevel) {
  if (acLevel < 20) return "QUIET";
  if (acLevel < 50) return "NORMAL SOUND";
  return "HIGH SOUND";
}

float calculateRiskScore(float vibLevel, float acLevel, float temp, float hum) {
  float score = 0;
  // Vibration component (40%)
  score += constrain(vibLevel * 0.4, 0, 40);
  // Acoustic component (25%)
  score += constrain(acLevel * 0.25, 0, 25);
  // Temperature component (15%)
  if (temp <= 0) score += 15;
  else if (temp <= 2) score += 8;
  // Humidity component (10%)
  if (hum >= 85) score += 10;
  else if (hum >= 70) score += 5;
  return constrain(score, 0, 100);
}

// ═══════════════════════════════════════════════════════════
//  MAIN LOOP
// ═══════════════════════════════════════════════════════════
void loop() {
  if (millis() - lastSendTime < SEND_INTERVAL) return;
  lastSendTime = millis();

  // ─── Read sensors ──────────────────────────────────────
  float accelX, accelY, accelZ;
  readADXL345(accelX, accelY, accelZ);

  float rawVibration = calculateVibration(accelX, accelY, accelZ);
  float vibrationLevel = calculateVibrationLevel(rawVibration);

  int micPeakToPeak;
  float acousticLevel;
  readMicrophone(micPeakToPeak, acousticLevel);

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Handle DHT read failures
  if (isnan(temperature)) {
    Serial.println("[DHT] Temperature read FAILED — using last known value");
    temperature = 20.0;
  }
  if (isnan(humidity)) {
    Serial.println("[DHT] Humidity read FAILED — using last known value");
    humidity = 50.0;
  }

  // Mock battery (in real product, read from ADC or fuel gauge)
  int battery = 76;

  // Wi-Fi signal strength
  int signalStrength = WiFi.RSSI();

  // ─── Calculate risk ───────────────────────────────────
  float riskScore = calculateRiskScore(vibrationLevel, acousticLevel, temperature, humidity);
  String status = determineStatus(riskScore);
  String mode = determineMode(vibrationLevel, acousticLevel, temperature, humidity);
  String activityLevel = determineActivity(riskScore);
  String soundStatus = determineSoundStatus(acousticLevel);

  // ─── LED indicator ────────────────────────────────────
  if (status == "CRITICAL") {
    digitalWrite(LED_PIN, (millis() / 200) % 2); // Fast blink
  } else if (status == "WARNING") {
    digitalWrite(LED_PIN, (millis() / 500) % 2); // Slow blink
  } else {
    digitalWrite(LED_PIN, HIGH); // Solid on
  }

  // ─── Print to Serial Monitor ──────────────────────────
  Serial.println("────────────────────────────────────");
  Serial.printf("Device: %s\n", DEVICE_ID);
  Serial.printf("accelX: %.4f g\n", accelX);
  Serial.printf("accelY: %.4f g\n", accelY);
  Serial.printf("accelZ: %.4f g\n", accelZ);
  Serial.printf("rawVibration: %.4f\n", rawVibration);
  Serial.printf("vibrationLevel: %.1f\n", vibrationLevel);
  Serial.printf("baseline: %.4f\n", vibBaseline);
  Serial.printf("acousticLevel: %.1f\n", acousticLevel);
  Serial.printf("micPeakToPeak: %d\n", micPeakToPeak);
  Serial.printf("soundStatus: %s\n", soundStatus.c_str());
  Serial.printf("temperature: %.1f °C\n", temperature);
  Serial.printf("humidity: %.1f %%\n", humidity);
  Serial.printf("battery: %d %%\n", battery);
  Serial.printf("signalStrength: %d dBm\n", signalStrength);
  Serial.printf("riskScore: %.0f\n", riskScore);
  Serial.printf("status: %s\n", status.c_str());
  Serial.printf("mode: %s\n", mode.c_str());
  Serial.printf("activityLevel: %s\n", activityLevel.c_str());
  Serial.printf("uptime: %lu ms\n", millis());

  // ─── Build JSON ───────────────────────────────────────
  StaticJsonDocument<1024> doc;
  doc["deviceId"]        = DEVICE_ID;
  doc["accelX"]          = round(accelX * 10000) / 10000.0;
  doc["accelY"]          = round(accelY * 10000) / 10000.0;
  doc["accelZ"]          = round(accelZ * 10000) / 10000.0;
  doc["rawVibration"]    = round(rawVibration * 10000) / 10000.0;
  doc["vibrationLevel"]  = round(vibrationLevel * 10) / 10.0;
  doc["baseline"]        = vibBaseline;
  doc["acousticLevel"]   = round(acousticLevel * 10) / 10.0;
  doc["micPeakToPeak"]   = micPeakToPeak;
  doc["soundStatus"]     = soundStatus;
  doc["temperature"]     = round(temperature * 10) / 10.0;
  doc["humidity"]        = round(humidity * 10) / 10.0;
  doc["battery"]         = battery;
  doc["signalStrength"]  = signalStrength;
  doc["riskScore"]       = (int)riskScore;
  doc["status"]          = status;
  doc["mode"]            = mode;
  doc["activityLevel"]   = activityLevel;
  doc["source"]          = "esp32";
  doc["uptimeMs"]        = millis();

  String jsonString;
  serializeJson(doc, jsonString);

  // ─── Send HTTP POST ───────────────────────────────────
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(jsonString);

    if (httpCode > 0) {
      Serial.printf("[HTTP] Response code: %d\n", httpCode);
      if (httpCode == 200) {
        String response = http.getString();
        Serial.println("[HTTP] Server response: " + response);
      }
    } else {
      Serial.printf("[HTTP] ERROR: %d\n", httpCode);
      Serial.println("[HTTP] Possible causes:");
      Serial.println("  - Wrong server IP address");
      Serial.println("  - Backend not running");
      Serial.println("  - Firewall blocking port 5000");
      Serial.println("  - ESP32 and laptop not on same WiFi");
    }

    http.end();
  } else {
    Serial.println("[WiFi] Not connected! Attempting reconnect...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }

  Serial.println();
  sampleCount++;
}
