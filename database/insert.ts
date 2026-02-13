import { SensorReading } from "@/types/sensor";
import { getDb } from "./db";

export async function insertReadings(data: SensorReading[]): Promise<void> {
  if (!data.length) return;

  const db = await getDb();
  await db.execAsync("BEGIN TRANSACTION");

  try {
    for (const d of data) {
      await db.runAsync(
        `
        INSERT INTO sensor_data (
          timestamp,
          ax, ay, az,
          gx, gy, gz,
          latitude, longitude,
          speed_mps, speed_kmph,
          magnitude,
          gyro_magnitude,
          transport_mode
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          d.timestamp,

          d.ax, d.ay, d.az,
          d.gx, d.gy, d.gz,

          d.latitude,
          d.longitude,

          d.speed_mps ?? 0, // Ensure speed is never null
          d.speed_kmph ?? 0, // Ensure speed is never null

          d.magnitude,
          d.gyro_magnitude,
          d.transport_mode,
        ]
      );
    }

    await db.execAsync("COMMIT");
  } catch (e) {
    await db.execAsync("ROLLBACK");
    throw e;
  }
}
