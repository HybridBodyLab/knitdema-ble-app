export const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";

export const CHARACTERISTIC_UUIDS = {
  led: "19b10011-e8f2-537e-4f6c-d104768a1214",
  start: "19b10013-e8f2-537e-4f6c-d104768a1214",
  thumb: "19b10014-e8f2-537e-4f6c-d104768a1214",
  index: "19b10015-e8f2-537e-4f6c-d104768a1214",
  middle: "19b10016-e8f2-537e-4f6c-d104768a1214",
  ring: "19b10017-e8f2-537e-4f6c-d104768a1214",
  pinky: "19b10018-e8f2-537e-4f6c-d104768a1214",
  palm: "19b10019-e8f2-537e-4f6c-d104768a1214",
};

export type CharacteristicKeys = keyof typeof CHARACTERISTIC_UUIDS;
