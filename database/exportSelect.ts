import { getDb } from "./db";

export async function getAllDataForExport() {
  const db = await getDb();

  const rows = await db.getAllAsync(`
    SELECT
      timestamp,
      ax, ay, az,
      gx, gy, gz,
      latitude, longitude,
      speed_mps, speed_kmph,
      magnitude,
      gyro_magnitude,
      transport_mode
    FROM sensor_data
    ORDER BY timestamp ASC
  `);

  return rows;
}
