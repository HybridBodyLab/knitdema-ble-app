/*
  Updated Code for ESP32 BLE SMA Control
  - Ensures all SMAs are off and characteristics are updated when the board stops
  - Resets the loop and values to the initial state when the board is disconnected
*/

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

// Initialize PWM drivers
Adafruit_PWMServoDriver pwm1 = Adafruit_PWMServoDriver(0x40);
Adafruit_PWMServoDriver pwm2 = Adafruit_PWMServoDriver(0x41);
Adafruit_PWMServoDriver pwm3 = Adafruit_PWMServoDriver(0x42);

// BLE UUIDs
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"

#define ledCHARACTERISTIC_UUID "19B10011-E8F2-537E-4F6C-D104768A1214"
#define startCHARACTERISTIC_UUID "19B10013-E8F2-537E-4F6C-D104768A1214"
#define thumbCHARACTERISTIC_UUID "19B10014-E8F2-537E-4F6C-D104768A1214"
#define indexCHARACTERISTIC_UUID "19B10015-E8F2-537E-4F6C-D104768A1214"
#define middleCHARACTERISTIC_UUID "19B10016-E8F2-537E-4F6C-D104768A1214"
#define ringCHARACTERISTIC_UUID "19B10017-E8F2-537E-4F6C-D104768A1214"
#define pinkyCHARACTERISTIC_UUID "19B10018-E8F2-537E-4F6C-D104768A1214"
#define palmCHARACTERISTIC_UUID "19B10019-E8F2-537E-4F6C-D104768A1214"

// BLE Characteristics
BLECharacteristic *ledCharacteristic;
BLECharacteristic *startCharacteristic;
BLECharacteristic *thumbCharacteristic;
BLECharacteristic *indexCharacteristic;
BLECharacteristic *middleCharacteristic;
BLECharacteristic *ringCharacteristic;
BLECharacteristic *pinkyCharacteristic;
BLECharacteristic *palmCharacteristic;

// SMA Pin Definitions (as per your original code)
// 0x42 pwm3
#define T_1 10 // SMA_T_1
#define T_2 11 // SMA_T_2
#define T_3 12 // SMA_T_3
#define T_4 13 // SMA_T_4
#define T_5 14 // SMA_T_5
#define T_6 15 // SMA_T_6
#define I_1 4  // SMA_I_1
#define I_2 5  // SMA_I_2
#define I_3 6  // SMA_I_3
#define I_4 7  // SMA_I_4
#define I_5 8  // SMA_I_5
#define I_6 9  // SMA_I_6
#define M_3 0  // SMA_M_3
#define M_4 1  // SMA_M_4
#define M_5 2  // SMA_M_5
#define M_6 3  // SMA_M_6

// 0x41 pwm2
#define PA_1 1 // SMA_PA1
#define PA_2 2 // SMA_PA2
#define PA_3 3 // SMA_PA3
#define PA_4 4 // SMA_PA4
#define PA_5 5 // SMA_PA5
#define PA_6 6 // SMA_PA6
#define PA_7 0 // SMA_PA7

// 0x40 pwm1
#define M_1 0    // SMA_M_1
#define M_2 1    // SMA_M_2
#define R_1 2    // SMA_R_1
#define R_2 3    // SMA_R_2
#define R_3 4    // SMA_R_3
#define R_4 5    // SMA_R_4
#define R_5 6    // SMA_R_5
#define R_6 7    // SMA_R_6
#define P_1 8    // SMA_P_1
#define P_2 9    // SMA_P_2
#define P_3 10   // SMA_P_3
#define P_4 11   // SMA_P_4
#define P_5 12   // SMA_P_5
#define P_6 13   // SMA_P_6
#define M_3_1 15 // SMA_M_3 (on pwm1)

// PWM Values
#define PWM_LOW 1024  // Low PWM
#define PWM_MED 2048  // Medium PWM
#define PWM_HIGH 3072 // High PWM
#define PWM_MAX 4096  // Maximum PWM

// Timing Variables
unsigned long startMillis;
const unsigned long period = 5000;
bool states[13] = {false};

// Palm SMA pins array for easy access
const uint8_t palmSMApins[] = {PA_1, PA_2, PA_3, PA_4, PA_5, PA_6, PA_7};

// Function Prototypes
void controlSMAs();
void deactivateAllSMAs();
void activateFingerSMA(int state);
void activatePalmSMA(int state);
void resetSequence();

// Variables to track device connection status
bool deviceConnected = false;

class MyServerCallbacks : public BLEServerCallbacks
{
    void onConnect(BLEServer *pServer)
    {
        Serial.println("Device connected");
        deviceConnected = true;
    }

    void onDisconnect(BLEServer *pServer)
    {
        Serial.println("Device disconnected, restarting advertising");
        deviceConnected = false;
        pServer->startAdvertising(); // Restart advertising
        // Reset loop and values to initial state
        resetSequence();
    }
};

void setup()
{
    Wire.begin(3, 4);
    Serial.begin(115200);
    Serial.println("Starting BLE work!");

    // Initialize BLE
    BLEDevice::init("esp32BLEKnitdema");
    BLEServer *pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    BLEService *pService = pServer->createService(BLEUUID(SERVICE_UUID), 30);

    // Create BLE Characteristics
    ledCharacteristic = pService->createCharacteristic(
        ledCHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
            BLECharacteristic::PROPERTY_WRITE |
            BLECharacteristic::PROPERTY_NOTIFY);
    startCharacteristic = pService->createCharacteristic(
        startCHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
            BLECharacteristic::PROPERTY_WRITE |
            BLECharacteristic::PROPERTY_NOTIFY);
    thumbCharacteristic = pService->createCharacteristic(
        thumbCHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
            BLECharacteristic::PROPERTY_WRITE |
            BLECharacteristic::PROPERTY_NOTIFY);
    indexCharacteristic = pService->createCharacteristic(
        indexCHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
            BLECharacteristic::PROPERTY_WRITE |
            BLECharacteristic::PROPERTY_NOTIFY);
    middleCharacteristic = pService->createCharacteristic(
        middleCHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
            BLECharacteristic::PROPERTY_WRITE |
            BLECharacteristic::PROPERTY_NOTIFY);
    ringCharacteristic = pService->createCharacteristic(
        ringCHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
            BLECharacteristic::PROPERTY_WRITE |
            BLECharacteristic::PROPERTY_NOTIFY);
    pinkyCharacteristic = pService->createCharacteristic(
        pinkyCHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
            BLECharacteristic::PROPERTY_WRITE |
            BLECharacteristic::PROPERTY_NOTIFY);
    palmCharacteristic = pService->createCharacteristic(
        palmCHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
            BLECharacteristic::PROPERTY_WRITE |
            BLECharacteristic::PROPERTY_NOTIFY);

    // Set initial values for the characteristics
    ledCharacteristic->setValue("0");
    startCharacteristic->setValue("0");
    thumbCharacteristic->setValue("000000");
    indexCharacteristic->setValue("000000");
    middleCharacteristic->setValue("000000");
    ringCharacteristic->setValue("000000");
    pinkyCharacteristic->setValue("000000");
    palmCharacteristic->setValue("0000000");

    pService->start();

    // Start advertising
    BLEAdvertising *pAdvertising = pServer->getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06); // Functions that help with iPhone connection issues
    pAdvertising->setMinPreferred(0x12);
    pAdvertising->start();

    Serial.println("Bluetooth device active, waiting for connections...");

    // Initialize PWM drivers
    pwm1.begin();
    pwm1.setPWMFreq(200);
    pwm2.begin();
    pwm2.setPWMFreq(200);
    pwm3.begin();
    pwm3.setPWMFreq(200);
}

void loop()
{
    static bool wasStarted = false;
    static bool isRunning = false;

    if (startCharacteristic->getValue() == "1" && deviceConnected)
    {
        if (!wasStarted)
        {
            startMillis = millis();
            wasStarted = true;
            isRunning = true;
        }
        if (isRunning)
        {
            controlSMAs();
        }
    }
    else
    {
        if (isRunning || wasStarted)
        {
            deactivateAllSMAs();
            memset(states, 0, sizeof(states));
            isRunning = false;
            wasStarted = false;

            // Reset BLE characteristics to show SMAs are off
            thumbCharacteristic->setValue("000000");
            indexCharacteristic->setValue("000000");
            middleCharacteristic->setValue("000000");
            ringCharacteristic->setValue("000000");
            pinkyCharacteristic->setValue("000000");
            palmCharacteristic->setValue("0000000");
        }
    }
}

void controlSMAs()
{
    unsigned long currentMillis = millis();
    unsigned long elapsedPeriods = (currentMillis - startMillis) / period;

    // Deactivate all SMAs if the elapsed periods exceed the number of states
    if (elapsedPeriods >= 13)
    {
        deactivateAllSMAs();
        memset(states, 0, sizeof(states));
        startMillis = currentMillis; // Reset the timer for continuous cycle
        return;
    }

    // Update states and control SMAs
    for (size_t i = 0; i < 13; ++i)
    {
        if (elapsedPeriods == i && !states[i])
        {
            states[i] = true;

            // Deactivate previous SMA group
            if (i > 0)
            {
                if (i <= 6)
                {
                    deactivateAllSMAs(); // Deactivate all finger SMAs
                }
                else
                {
                    pwm2.setPin(palmSMApins[i - 7], 0); // Deactivate previous palm SMA
                }
            }

            // Activate current SMA group
            if (i < 6)
            {
                activateFingerSMA(i + 1);
                Serial.printf("Finger SMA %d activated\n", i + 1);
            }
            else if (i < 13)
            {
                activatePalmSMA(i - 6);
                Serial.printf("Palm SMA %d activated\n", i - 6 + 1);
            }
        }
    }
}

void activateFingerSMA(int state)
{
    // Deactivate all finger SMAs first
    deactivateAllSMAs();

    // Update BLE characteristics
    char fingerState[7] = "000000";
    fingerState[state - 1] = '1';
    thumbCharacteristic->setValue(fingerState);
    indexCharacteristic->setValue(fingerState);
    middleCharacteristic->setValue(fingerState);
    ringCharacteristic->setValue(fingerState);
    pinkyCharacteristic->setValue(fingerState);
    palmCharacteristic->setValue("0000000");

    // Activate the corresponding SMAs
    switch (state)
    {
    case 1:
        // Activate SMA 1 for all fingers
        pwm3.setPWM(T_1, PWM_MAX, 0);
        pwm3.setPWM(I_1, PWM_MAX, 0);
        pwm1.setPWM(M_1, PWM_MAX, 0);
        pwm1.setPWM(R_1, PWM_MAX, 0);
        pwm1.setPWM(P_1, PWM_MAX, 0);
        break;
    case 2:
        pwm3.setPWM(T_2, PWM_MAX, 0);
        pwm3.setPWM(I_2, PWM_MAX, 0);
        pwm1.setPWM(M_2, PWM_MAX, 0);
        pwm1.setPWM(R_2, PWM_MAX, 0);
        pwm1.setPWM(P_2, PWM_MAX, 0);
        break;
    case 3:
        pwm3.setPWM(T_3, PWM_MAX, 0);
        pwm3.setPWM(I_3, PWM_MAX, 0);
        pwm3.setPWM(M_3, PWM_MAX, 0);
        pwm1.setPWM(R_3, PWM_MAX, 0);
        pwm1.setPWM(P_3, PWM_MAX, 0);
        break;
    case 4:
        pwm3.setPWM(T_4, PWM_MAX, 0);
        pwm3.setPWM(I_4, PWM_MAX, 0);
        pwm3.setPWM(M_4, PWM_MAX, 0);
        pwm1.setPWM(R_4, PWM_MAX, 0);
        pwm1.setPWM(P_4, PWM_MAX, 0);
        break;
    case 5:
        pwm3.setPWM(T_5, PWM_MAX, 0);
        pwm3.setPWM(I_5, PWM_MAX, 0);
        pwm3.setPWM(M_5, PWM_MAX, 0);
        pwm1.setPWM(R_5, PWM_MAX, 0);
        pwm1.setPWM(P_5, PWM_MAX, 0);
        break;
    case 6:
        pwm3.setPWM(T_6, PWM_MAX, 0);
        pwm3.setPWM(I_6, PWM_MAX, 0);
        pwm3.setPWM(M_6, PWM_MAX, 0);
        pwm1.setPWM(R_6, PWM_MAX, 0);
        pwm1.setPWM(P_6, PWM_MAX, 0);
        break;
    default:
        break;
    }
}

void activatePalmSMA(int state)
{
    // Deactivate previous palm SMA if any
    if (state > 0)
    {
        pwm2.setPin(palmSMApins[state - 1], 0);
    }

    // Update BLE characteristics
    char palmState[8] = "0000000";
    palmState[state] = '1';
    palmCharacteristic->setValue(palmState);

    // Deactivate finger SMAs
    deactivateAllSMAs();

    // Activate the corresponding palm SMA
    pwm2.setPWM(palmSMApins[state], PWM_MAX, 0);
}

void deactivateAllSMAs()
{
    // Deactivate all finger SMAs
    pwm3.setPin(T_1, 0);
    pwm3.setPin(T_2, 0);
    pwm3.setPin(T_3, 0);
    pwm3.setPin(T_4, 0);
    pwm3.setPin(T_5, 0);
    pwm3.setPin(T_6, 0);
    pwm3.setPin(I_1, 0);
    pwm3.setPin(I_2, 0);
    pwm3.setPin(I_3, 0);
    pwm3.setPin(I_4, 0);
    pwm3.setPin(I_5, 0);
    pwm3.setPin(I_6, 0);
    pwm1.setPin(M_1, 0);
    pwm1.setPin(M_2, 0);
    pwm3.setPin(M_3, 0);
    pwm3.setPin(M_4, 0);
    pwm3.setPin(M_5, 0);
    pwm3.setPin(M_6, 0);
    pwm1.setPin(R_1, 0);
    pwm1.setPin(R_2, 0);
    pwm1.setPin(R_3, 0);
    pwm1.setPin(R_4, 0);
    pwm1.setPin(R_5, 0);
    pwm1.setPin(R_6, 0);
    pwm1.setPin(P_1, 0);
    pwm1.setPin(P_2, 0);
    pwm1.setPin(P_3, 0);
    pwm1.setPin(P_4, 0);
    pwm1.setPin(P_5, 0);
    pwm1.setPin(P_6, 0);

    // Deactivate all palm SMAs
    pwm2.setPin(PA_1, 0);
    pwm2.setPin(PA_2, 0);
    pwm2.setPin(PA_3, 0);
    pwm2.setPin(PA_4, 0);
    pwm2.setPin(PA_5, 0);
    pwm2.setPin(PA_6, 0);
    pwm2.setPin(PA_7, 0);

    Serial.println("All SMAs deactivated");
}

void resetSequence()
{
    // Reset loop and values to initial state
    deactivateAllSMAs();
    memset(states, 0, sizeof(states));
    startCharacteristic->setValue("0");

    // Reset BLE characteristics to initial values
    thumbCharacteristic->setValue("000000");
    indexCharacteristic->setValue("000000");
    middleCharacteristic->setValue("000000");
    ringCharacteristic->setValue("000000");
    pinkyCharacteristic->setValue("000000");
    palmCharacteristic->setValue("0000000");

    Serial.println("Sequence reset to initial state");
}