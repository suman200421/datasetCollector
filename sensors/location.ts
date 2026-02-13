import * as Location from "expo-location";

export async function startLocation(cb: (l: any) => void) {
  await Location.requestForegroundPermissionsAsync();

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 1000,
      distanceInterval: 0,
    },
    cb
  );
}
