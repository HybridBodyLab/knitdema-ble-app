/*
  Updated Code for ESP32 BLE SMA Control
  - implement 6 different levels to 
*/

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

//DEEP SLEEP MODE
#include <esp_sleep.h>
#include <driver/rtc_io.h>
/*
  Method to print the reason by which ESP32
  has been awaken from sleep
*/
void print_wakeup_reason() {
  esp_sleep_wakeup_cause_t wakeup_reason;

  wakeup_reason = esp_sleep_get_wakeup_cause();

  switch (wakeup_reason) {
    case ESP_SLEEP_WAKEUP_EXT0:     Serial.println("Wakeup caused by external signal using RTC_IO"); break;
    case ESP_SLEEP_WAKEUP_EXT1:     Serial.println("Wakeup caused by external signal using RTC_CNTL"); break;
    case ESP_SLEEP_WAKEUP_TIMER:    Serial.println("Wakeup caused by timer"); break;
    case ESP_SLEEP_WAKEUP_TOUCHPAD: Serial.println("Wakeup caused by touchpad"); break;
    case ESP_SLEEP_WAKEUP_ULP:      Serial.println("Wakeup caused by ULP program"); break;
    default:                        Serial.printf("Wakeup was not caused by deep sleep: %d\n", wakeup_reason); break;
  }
}




#define BUTTON_PIN_BITMASK(GPIO) (1ULL << GPIO)  // 2 ^ GPIO_NUMBER in hex
#define USE_EXT0_WAKEUP          1               // 1 = EXT0 wakeup, 0 = EXT1 wakeup
#define WAKEUP_GPIO              GPIO_NUM_5     // Only RTC IO are allowed - ESP32 Pin example
RTC_DATA_ATTR int bootCount = 0;


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

///////////////////////////////////////////////////////////////////////
// --------------------- PWM Values Setting ------------------------ //
///////////////////////////////////////////////////////////////////////
// #define PWM_LOW 3600  // Low PWM
// #define PWM_MED 3300  // Medium PWM
// #define PWM_HIGH 3072 // High PWM
// #define PWM_MAX 3300  // Maximum PWM
// #define PWM_PALM 1000 //4096 // Palm PWM
// #define PWM_PINKY 3000
// #define PWM_RING 3000
// #define PWM_MIDDLE 3000
// #define PWM_INDEX 3000
// #define PWM_THUMB 3000

//p5
// #define PWM_PALM 2500 // 4096 // Palm PWM
// #define PWM_PINKY 3000
// #define PWM_RING 3000
// #define PWM_MIDDLE 3000
// #define PWM_INDEX 3000
// #define PWM_THUMB 3000
//-----
// #define PWM_PALM 2048 // 0.75 * max voltage
// #define PWM_PINKY 1024 // 0.25 * max voltage
// #define PWM_RING 1024
// #define PWM_MIDDLE 1024
// #define PWM_INDEX 1024
// #define PWM_THUMB 1024 

//p1
// #define PWM_PALM 1000 // 4096 // Palm PWM
// #define PWM_PINKY 3000
// #define PWM_RING 3000
// #define PWM_MIDDLE 3000
// #define PWM_INDEX 3000
// #define PWM_THUMB 2000
//-----
// #define PWM_PALM 3072 // 0.75 * max voltage
// #define PWM_PINKY 1024 // 0.25 * max voltage
// #define PWM_RING 1024
// #define PWM_MIDDLE 1024
// #define PWM_INDEX 1024
// #define PWM_THUMB 2048 // 0.5* max voltage

// p3
// const int PWM_PALM_VALUES[] = {1000, 1100, 1200, 1300, 1400, 1500, 1500}; // set different SMA to diff values
// // #define PWM_PALM 1500 
// #define PWM_PINKY 800 
// #define PWM_RING 800
// #define PWM_MIDDLE 800
// #define PWM_INDEX 1000
// #define PWM_THUMB 1000 

//p6
// const int PWM_THUMB_VALUES[] = {1000, 1000, 900, 900, 600, 600};
// const int PWM_INDEX_VALUES[] = {1000, 1000, 1000, 1000, 1000, 1000};
// const int PWM_MIDDLE_VALUES[] = {1000, 1000, 1000, 1000, 1000, 1000}; 
// const int PWM_RING_VALUES[] = {800, 800, 800, 800, 800, 800};
// const int PWM_PINKY_VALUES[] = {600, 600, 600, 600, 600, 600};
// const int PWM_PALM_VALUES[] = {2200, 2000, 2200, 2200, 2200, 2000, 1800}; // set different SMA to diff values

// Implement 6 different levels - test
// 6 Preset PWM arrays for each finger/palm
const int PWM_THUMB_PRESETS[6][6] = {
  {800, 800, 800, 800, 800, 800},
  {900, 900, 900, 900, 900, 900},
  {1000,1000,1000,1000,1000,1000},
  {1100,1100,1100,1100,1100,1100},
  {1200,1200,1200,1200,1200,1200},
  {1300,1300,1300,1300,1300,1300}
};

const int PWM_INDEX_PRESETS[6][6] = {
  {800, 800, 800, 800, 800, 800},
  {900, 900, 900, 900, 900, 900},
  {1000,1000,1000,1000,1000,1000},
  {1100,1100,1100,1100,1100,1100},
  {1200,1200,1200,1200,1200,1200},
  {1300,1300,1300,1300,1300,1300}
};

const int PWM_MIDDLE_PRESETS[6][6] = {
  {800, 800, 800, 800, 800, 800},
  {900, 900, 900, 900, 900, 900},
  {1000,1000,1000,1000,1000,1000},
  {1100,1100,1100,1100,1100,1100},
  {1200,1200,1200,1200,1200,1200},
  {1300,1300,1300,1300,1300,1300}
};

const int PWM_RING_PRESETS[6][6] = {
  {800, 800, 800, 800, 800, 800},
  {900, 900, 900, 900, 900, 900},
  {1000,1000,1000,1000,1000,1000},
  {1100,1100,1100,1100,1100,1100},
  {1200,1200,1200,1200,1200,1200},
  {1300,1300,1300,1300,1300,1300}
};

const int PWM_PINKY_PRESETS[6][6] = {
  {600, 600, 600, 600, 600, 600},
  {700, 700, 700, 700, 700, 700},
  {800, 800, 800, 800, 800, 800},
  {900, 900, 900, 900, 900, 900},
  {1000,1000,1000,1000,1000,1000},
  {1100,1100,1100,1100,1100,1100}
};

const int PWM_PALM_PRESETS[6][7] = {
  {1200, 1000, 1200, 1200, 1200, 1000, 800},   
  {1400, 1200, 1400, 1400, 1400, 1200, 1000},  
  {1600, 1400, 1600, 1600, 1600, 1400, 1200},  
  {1800, 1600, 1800, 1800, 1800, 1600, 1400},  
  {2200, 2000, 2200, 2200, 2200, 2000, 1800}, 
  {2400, 2200, 2400, 2400, 2400, 2200, 2000}   
};

// Active PWM values that will be used in SMA control
int PWM_THUMB_VALUES[6];
int PWM_INDEX_VALUES[6];
int PWM_MIDDLE_VALUES[6];
int PWM_RING_VALUES[6];
int PWM_PINKY_VALUES[6];
int PWM_PALM_VALUES[7];
/////////////////////////////////////////////////////////////////////////////////////
// ---------------- End of PWM Values Setting -------------------------------------//
/////////////////////////////////////////////////////////////////////////////////////


// #define BOARD_IDLE_TIME 300000 // 3min
#define BOARD_IDLE_TIME 60000 // 1min
// #define BOARD_IDLE_TIME 30000 // 30secs
// Timing Variables
unsigned long startMillis, boardStartTime;
const unsigned long period = 5000;
bool states[27] = {false};

// Palm SMA pins array for easy access
const uint8_t palmSMApins[] = {PA_1, PA_2, PA_3, PA_4, PA_5, PA_6, PA_7};

// Function Prototypes
void controlSMAs();
void deactivateAllSMAs();
void activateFingerSMA(int state);
void activatePalmSMA(int state);
void resetSequence();
void deepsleep();

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

// Define PWM setting callback
class LevelSelectCallback : public BLECharacteristicCallbacks {
  String label;
public:
  LevelSelectCallback(String label) : label(label) {}

  void onWrite(BLECharacteristic *pCharacteristic) override {
    std::string value = pCharacteristic->getValue();
    if (!value.empty() && isdigit(value[0])) {
      int level = value[0] - '0';
      if (level >= 0 && level < 6) {
        Serial.printf("Set %s to level %d\n", label.c_str(), level);

        if (label == "thumb") {
          memcpy(PWM_THUMB_VALUES, PWM_THUMB_PRESETS[level], sizeof(PWM_THUMB_VALUES));
        } else if (label == "index") {
          memcpy(PWM_INDEX_VALUES, PWM_INDEX_PRESETS[level], sizeof(PWM_INDEX_VALUES));
        } else if (label == "middle") {
          memcpy(PWM_MIDDLE_VALUES, PWM_MIDDLE_PRESETS[level], sizeof(PWM_MIDDLE_VALUES));
        } else if (label == "ring") {
          memcpy(PWM_RING_VALUES, PWM_RING_PRESETS[level], sizeof(PWM_RING_VALUES));
        } else if (label == "pinky") {
          memcpy(PWM_PINKY_VALUES, PWM_PINKY_PRESETS[level], sizeof(PWM_PINKY_VALUES));
        } else if (label == "palm") {
          memcpy(PWM_PALM_VALUES, PWM_PALM_PRESETS[level], sizeof(PWM_PALM_VALUES));
        }
      }
    }
  }
};


void setup()
{
    Wire.begin(3, 4);
    Serial.begin(115200);
    Serial.println("Starting BLE work!");
    pinMode (6, OUTPUT);
    pinMode (9, OUTPUT);
    pinMode(7, OUTPUT);
    digitalWrite (9, LOW);
    digitalWrite (6, LOW);
    digitalWrite (7, LOW);
    pwm1.begin();
    pwm1.setPWMFreq(200);
    pwm2.begin();
    pwm2.setPWMFreq(200);
    pwm3.begin();
    pwm3.setPWMFreq(200);
    deactivateAllSMAs();
    // DEEP SLEEP/WAKEUP CODE:
    //esp_sleep_enable_ext0_wakeup(5, 1)
    ++bootCount;
    Serial.println("Boot number: " + String(bootCount));
    //Print the wakeup reason for ESP32
    print_wakeup_reason();

  /*
    First we configure the wake up source
    We set our ESP32 to wake up for an external trigger.
    There are two types for ESP32, ext0 and ext1 .
    ext0 uses RTC_IO to wakeup thus requires RTC peripherals
    to be on while ext1 uses RTC Controller so does not need
    peripherals to be powered on.
    Note that using internal pullups/pulldowns also requires
    RTC peripherals to be turned on.
  */
  #if USE_EXT0_WAKEUP
    esp_sleep_enable_ext0_wakeup(WAKEUP_GPIO, 1);  //1 = High, 0 = Low
    // Configure pullup/downs via RTCIO to tie wakeup pins to inactive level during deepsleep.
    // EXT0 resides in the same power domain (RTC_PERIPH) as the RTC IO pullup/downs.
    // No need to keep that power domain explicitly, unlike EXT1.
    rtc_gpio_pullup_dis(WAKEUP_GPIO);
    rtc_gpio_pulldown_en(WAKEUP_GPIO);

  #else  // EXT1 WAKEUP
    //If you were to use ext1, you would use it like
    esp_sleep_enable_ext1_wakeup_io(BUTTON_PIN_BITMASK(WAKEUP_GPIO), ESP_EXT1_WAKEUP_ANY_HIGH);
    /*
      If there are no external pull-up/downs, tie wakeup pins to inactive level with internal pull-up/downs via RTC IO
          during deepsleep. However, RTC IO relies on the RTC_PERIPH power domain. Keeping this power domain on will
          increase some power comsumption. However, if we turn off the RTC_PERIPH domain or if certain chips lack the RTC_PERIPH
          domain, we will use the HOLD feature to maintain the pull-up and pull-down on the pins during sleep.
    */
    rtc_gpio_pulldown_en(WAKEUP_GPIO);  // GPIO5 is tie to GND in order to wake up in HIGH
    rtc_gpio_pullup_dis(WAKEUP_GPIO);   // Disable PULL_UP in order to allow it to wakeup on HIGH
  #endif
    //Go to sleep now
  if (bootCount==0||bootCount==1){
    Serial.println("Going to sleep now");
    esp_deep_sleep_start();
    Serial.println("This will never be printed");
  }


    // Initialize BLE
    BLEDevice::init("Knitdema Glove");
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
    digitalWrite (6, HIGH); //LED ON
    digitalWrite (7, HIGH); //Turn Battery Charge off
    digitalWrite (9, HIGH); //Enable Buck Boost
    deactivateAllSMAs();
    boardStartTime = millis();

  ///////////////////////////////////////////////////////////////////////
  // ------------------- For PWM Level Control ------------------------//
  thumbCharacteristic->setCallbacks(new LevelSelectCallback("thumb"));
  indexCharacteristic->setCallbacks(new LevelSelectCallback("index"));
  middleCharacteristic->setCallbacks(new LevelSelectCallback("middle"));
  ringCharacteristic->setCallbacks(new LevelSelectCallback("ring"));
  pinkyCharacteristic->setCallbacks(new LevelSelectCallback("pinky"));
  palmCharacteristic->setCallbacks(new LevelSelectCallback("palm"));

  // Set the default PWM to level 0
  memcpy(PWM_THUMB_VALUES,  PWM_THUMB_PRESETS[0], sizeof(PWM_THUMB_VALUES));
  memcpy(PWM_INDEX_VALUES,  PWM_INDEX_PRESETS[0], sizeof(PWM_INDEX_VALUES));
  memcpy(PWM_MIDDLE_VALUES, PWM_MIDDLE_PRESETS[0], sizeof(PWM_MIDDLE_VALUES));
  memcpy(PWM_RING_VALUES,   PWM_RING_PRESETS[0], sizeof(PWM_RING_VALUES));
  memcpy(PWM_PINKY_VALUES,  PWM_PINKY_PRESETS[0], sizeof(PWM_PINKY_VALUES));
  memcpy(PWM_PALM_VALUES,   PWM_PALM_PRESETS[0], sizeof(PWM_PALM_VALUES));
  ///////////////////////////////////////////////////////////////////////

}

void loop()
{
    static bool wasStarted = false;
    static bool isRunning = false;

    if(!deviceConnected && (millis() - boardStartTime) > BOARD_IDLE_TIME) {
    boardStartTime = millis();
    Serial.println("Board idle for too long, going to deep sleep");
    resetSequence();
    }
    if (startCharacteristic->getValue() == "1" && deviceConnected)
    {
        if (!wasStarted)
        {
            startMillis = millis();
            wasStarted = true;
            isRunning = true;
            digitalWrite (0, HIGH);
        }
        if (isRunning)
        {
            controlSMAs();
            digitalWrite (0, HIGH);
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
    if (elapsedPeriods >= 27)
    {
        deactivateAllSMAs();
        memset(states, 0, sizeof(states));
        startMillis = currentMillis; // Reset the timer for continuous cycle
        return;
    }

    // Update states and control SMAs
    for (size_t i = 0; i < 27; ++i)
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
                  if ((i%3 == 0))
                    pwm2.setPin(palmSMApins[(i/3 - 3)], 0); // Deactivate previous palm SMA
                }
            }

            // Activate current SMA group
            if (i < 6)
            {
                activateFingerSMA(i + 1);
                Serial.printf("Finger SMA %d activated\n", i + 1);
            }
            else if (i < 27)
            {
            if ((i % 3) == 0)
                  {
                    activatePalmSMA(i/3 - 2);
                    Serial.printf("Palm SMA %d activated\n", i - 6 + 1);
                  }  
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
        pwm3.setPWM(T_1, 0, PWM_THUMB_VALUES[state-1]);
        pwm3.setPWM(I_1, 250, 250 + PWM_INDEX_VALUES[state-1]);
        pwm1.setPWM(M_1, 500, 500 + PWM_MIDDLE_VALUES[state-1]);
        pwm1.setPWM(R_1, 750, 750 + PWM_RING_VALUES[state-1]);
        pwm1.setPWM(P_1, 1000, 1000 + PWM_PINKY_VALUES[state-1]);
        break;
    case 2:
        pwm3.setPWM(T_2, 0, PWM_THUMB_VALUES[state-1]);
        pwm3.setPWM(I_2, 250, 250 + PWM_INDEX_VALUES[state-1]);
        pwm1.setPWM(M_2, 500, 500 + PWM_MIDDLE_VALUES[state-1]);
        pwm1.setPWM(R_2, 750, 750 + PWM_RING_VALUES[state-1]);
        pwm1.setPWM(P_2, 1000, 1000 + PWM_PINKY_VALUES[state-1]);
        break;
    case 3:
        pwm3.setPWM(T_3, 0, PWM_THUMB_VALUES[state-1]);
        pwm3.setPWM(I_3, 250, 250 + PWM_INDEX_VALUES[state-1]);
        pwm3.setPWM(M_3, 500, 500 + PWM_MIDDLE_VALUES[state-1]);
        pwm1.setPWM(R_3, 750, 750 + PWM_RING_VALUES[state-1]);
        pwm1.setPWM(P_3, 1000, 1000 + PWM_PINKY_VALUES[state-1]);
        break;
    case 4:
        pwm3.setPWM(T_4, 0, PWM_THUMB_VALUES[state-1]);
        pwm3.setPWM(I_4, 250, 250 + PWM_INDEX_VALUES[state-1]);
        pwm3.setPWM(M_4, 500, 500 + PWM_MIDDLE_VALUES[state-1]);
        pwm1.setPWM(R_4, 750, 750 + PWM_RING_VALUES[state-1]);
        pwm1.setPWM(P_4, 1000, 1000 + PWM_PINKY_VALUES[state-1]);
        break;
    case 5:
        pwm3.setPWM(T_5, 0, PWM_THUMB_VALUES[state-1]);
        pwm3.setPWM(I_5, 250, 250 + PWM_INDEX_VALUES[state-1]);
        pwm3.setPWM(M_5, 500, 500 + PWM_MIDDLE_VALUES[state-1]);
        pwm1.setPWM(R_5, 750, 750 + PWM_RING_VALUES[state-1]);
        pwm1.setPWM(P_5, 1000, 1000 + PWM_PINKY_VALUES[state-1]);
        break;
    case 6:
        pwm3.setPWM(T_6, 0, PWM_THUMB_VALUES[state-1]);
        pwm3.setPWM(I_6, 250, 250 + PWM_INDEX_VALUES[state-1]);
        pwm3.setPWM(M_6, 500, 500 + PWM_MIDDLE_VALUES[state-1]);
        pwm1.setPWM(R_6, 750, 750 + PWM_RING_VALUES[state-1]);
        pwm1.setPWM(P_6, 1000, 1000 + PWM_PINKY_VALUES[state-1]);
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
    thumbCharacteristic->setValue("000000");
    indexCharacteristic->setValue("000000");
    middleCharacteristic->setValue("000000");
    ringCharacteristic->setValue("000000");
    pinkyCharacteristic->setValue("000000");
    palmCharacteristic->setValue(palmState);

    // Deactivate finger SMAs
    deactivateAllSMAs();

    // Activate the corresponding palm SMA
    int pwm_value = PWM_PALM_VALUES[state]; // customize pwm
    pwm2.setPWM(palmSMApins[state], 0, pwm_value); // pwm setting with customize
    // pwm2.setPWM(palmSMApins[state], 0, PWM_PALM); // pwm setting without customize
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
    digitalWrite (9, LOW);
    digitalWrite(7, LOW);
    bootCount=0;
    ++bootCount;
    // Reset BLE characteristics to initial values
    thumbCharacteristic->setValue("000000");
    indexCharacteristic->setValue("000000");
    middleCharacteristic->setValue("000000");
    ringCharacteristic->setValue("000000");
    pinkyCharacteristic->setValue("000000");
    palmCharacteristic->setValue("0000000");

    deepsleep();
    Serial.println("Sequence reset to initial state");
}

void deepsleep()
{
  #if USE_EXT0_WAKEUP
    esp_sleep_enable_ext0_wakeup(WAKEUP_GPIO, 1);  //1 = High, 0 = Low
    // Configure pullup/downs via RTCIO to tie wakeup pins to inactive level during deepsleep.
    // EXT0 resides in the same power domain (RTC_PERIPH) as the RTC IO pullup/downs.
    // No need to keep that power domain explicitly, unlike EXT1.
    rtc_gpio_pullup_dis(WAKEUP_GPIO);
    rtc_gpio_pulldown_en(WAKEUP_GPIO);

  #else  // EXT1 WAKEUP
    //If you were to use ext1, you would use it like
    esp_sleep_enable_ext1_wakeup_io(BUTTON_PIN_BITMASK(WAKEUP_GPIO), ESP_EXT1_WAKEUP_ANY_HIGH);
    /*
      If there are no external pull-up/downs, tie wakeup pins to inactive level with internal pull-up/downs via RTC IO
          during deepsleep. However, RTC IO relies on the RTC_PERIPH power domain. Keeping this power domain on will
          increase some power comsumption. However, if we turn off the RTC_PERIPH domain or if certain chips lack the RTC_PERIPH
          domain, we will use the HOLD feature to maintain the pull-up and pull-down on the pins during sleep.
    */
    rtc_gpio_pulldown_en(WAKEUP_GPIO);  // GPIO5 is tie to GND in order to wake up in HIGH
    rtc_gpio_pullup_dis(WAKEUP_GPIO);   // Disable PULL_UP in order to allow it to wakeup on HIGH
  #endif
    //Go to sleep now
  if (bootCount==0||bootCount==1){
    Serial.println("Going to sleep now");
    esp_deep_sleep_start();
    Serial.println("This will never be printed");
  }
}