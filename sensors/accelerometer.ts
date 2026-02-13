import { Accelerometer } from "expo-sensors";

export function startAccelerometer(cb: (a: any) => void) {
  Accelerometer.setUpdateInterval(100);
  return Accelerometer.addListener(cb);
}
