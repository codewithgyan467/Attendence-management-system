# ESP32 Classroom Hardware Beacon Setup & Provisioning Guide

## 1. Hardware Bill of Materials (BOM)

| Item | Component | Specification | Quantity |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | NodeMCU ESP32-WROOM-32 | Dual-core Xtensa 32-bit LX6, 240MHz, BLE 4.2 / WiFi | 1 per classroom |
| **Power Supply** | Micro-USB 5V / 2A | Regulated 5V DC power adapter | 1 |
| **Status Indicators**| 5mm LEDs (Green, Red, Blue) | GPIO status indicators (Active, Beacon, Error) | 3 |
| **Current Limiting** | 220 Ohm Resistors | 1/4W Through-hole resistors | 3 |
| **Enclosure** | 3D Printed / ABS Case | Wall-mountable classroom ceiling/wall mount | 1 |

---

## 2. Hardware Wiring Diagram

```
ESP32 Pinout:
   [GPIO 2]  ---- [220Ω] ---- [Green LED (System Heartbeat)] ---- GND
   [GPIO 4]  ---- [220Ω] ---- [Blue LED (BLE Beacon Active)] ---- GND
   [GPIO 5]  ---- [220Ω] ---- [Red LED (Error / Desync)]   ---- GND
   [VIN / 5V] ---------------- USB 5V VBUS
   [GND]     ---------------- Common Ground
```

---

## 3. Device Provisioning Workflow

1. **Database Registration:** The administrator registers the classroom device in PostgreSQL:
   ```sql
   INSERT INTO "ESP32Device" ("id", "deviceId", "publicKey", "classroomId", "status")
   VALUES (
     gen_random_uuid(),
     'ESP32-AEC-MCA-LAB1',
     'aec_secret_hmac_key_2026_xyz987',
     'classroom_uuid_here',
     'ACTIVE'
   );
   ```

2. **Flashing Firmware:**
   * Open `backend/hardware/esp32_attendance_beacon.ino` in Arduino IDE or PlatformIO.
   * Configure `DEVICE_ID` and `DEVICE_SECRET_KEY` in the sketch config section.
   * Connect ESP32 via USB and select Board: `ESP32 Dev Module`.
   * Upload code at 115200 baud.

3. **Verification Checklist:**
   * Green LED blinks every 1 second (system loop active).
   * Blue LED illuminates (BLE advertising active with Service UUID `0000AEC1-0000-1000-8000-00805F9B34FB`).
   * Serial Monitor outputs rotating 90-second challenge nonces.
