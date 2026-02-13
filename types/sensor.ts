export type TransportMode =
  | "train"
  | "car"
  | "bus"
  | "bike"
  | "walking"
  | "standing"
  | "auto";

export interface SensorReading {
  timestamp: number;

  ax: number;
  ay: number;
  az: number;

  gx: number;
  gy: number;
  gz: number;

  latitude: number | null;
  longitude: number | null;
  speed_mps: number | null;
  speed_kmph: number | null;

  magnitude: number;
  gyro_magnitude: number;
  transport_mode: TransportMode;
}
