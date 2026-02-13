import { Gyroscope } from "expo-sensors";

export function startGyroscope(cb: (g: any) => void) {
  Gyroscope.setUpdateInterval(100);
  return Gyroscope.addListener(cb);
}
