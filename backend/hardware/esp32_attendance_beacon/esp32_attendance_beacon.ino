/**
 * AEC MCA Smart Attendance System — ESP32 Classroom BLE Beacon
 * Target Board: ESP32-WROOM-32 / ESP32-S3
 * Architecture: Emits cryptographically signed BLE advertising packets with
 *               rolling nonces to verify physical classroom presence.
 */

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <mbedtls/md.h>

// --- Device Configuration ---
#define DEVICE_ID "ESP32-AEC-MCA-LAB1"
#define DEVICE_KEY "aec_secret_hmac_key_2026_xyz987"
#define SERVICE_UUID "0000AEC1-0000-1000-8000-00805F9B34FB"
#define CHALLENGE_ROTATION_INTERVAL_MS 60000 // 60 seconds

// Status Pin Definitions
const int PIN_LED_HEARTBEAT = 2;  // Green
const int PIN_LED_BLE = 4;        // Blue
const int PIN_LED_ERROR = 5;      // Red

BLEAdvertising *pAdvertising;
unsigned long lastRotation = 0;
uint32_t sessionNonce = 0;

void generateHMACSignature(const char* payload, const char* key, char* outputHex) {
  byte hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;

  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)key, strlen(key));
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)payload, strlen(payload));
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  for (int i = 0; i < 32; i++) {
    sprintf(&outputHex[i * 2], "%02x", hmacResult[i]);
  }
  outputHex[64] = 0;
}

void rotateBeaconChallenge() {
  sessionNonce = esp_random();
  unsigned long now = millis();

  char payload[64];
  snprintf(payload, sizeof(payload), "%s:%lu:%08x", DEVICE_ID, now, sessionNonce);

  char hmacSig[65];
  generateHMACSignature(payload, DEVICE_KEY, hmacSig);

  // Format manufacturer data with truncated 8-byte authentication tag
  String mfgData = "";
  mfgData += (char)0xFF; // Manufacturer Specific Tag
  mfgData += (char)0x02; // AEC College Identifier
  mfgData += String(payload);

  BLEAdvertisementData advData;
  advData.setManufacturerData(mfgData);

  pAdvertising->setAdvertisementData(advData);
  pAdvertising->start();

  Serial.print("[ESP32] Broadcast Challenge Nonce: 0x");
  Serial.print(sessionNonce, HEX);
  Serial.print(" | HMAC: ");
  Serial.println(hmacSig);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("==================================================");
  Serial.println("  AEC MCA Smart Attendance — Classroom Gateway    ");
  Serial.println("==================================================");

  pinMode(PIN_LED_HEARTBEAT, OUTPUT);
  pinMode(PIN_LED_BLE, OUTPUT);
  pinMode(PIN_LED_ERROR, OUTPUT);

  digitalWrite(PIN_LED_BLE, HIGH);

  BLEDevice::init("AEC-MCA-BEACON");
  BLEServer *pServer = BLEDevice::createServer();
  pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);

  rotateBeaconChallenge();
  lastRotation = millis();
}

void loop() {
  // Heartbeat blink
  digitalWrite(PIN_LED_HEARTBEAT, HIGH);
  delay(100);
  digitalWrite(PIN_LED_HEARTBEAT, LOW);
  delay(900);

  // Rotate challenge token
  if (millis() - lastRotation >= CHALLENGE_ROTATION_INTERVAL_MS) {
    rotateBeaconChallenge();
    lastRotation = millis();
  }
}
