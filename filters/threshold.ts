import { SensorReading } from "@/types/sensor";

export function thresholdFilter(data: SensorReading[], t = 0.03) {
  return data.map(d => ({
    ...d,
    ax: Math.abs(d.ax) < t ? 0 : d.ax,
    ay: Math.abs(d.ay) < t ? 0 : d.ay,
    az: Math.abs(d.az) < t ? 0 : d.az,
  }));
}
