import { getDb } from "./db";

export async function initDatabase() {
  const db = await getDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sensor_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER,

      ax REAL, ay REAL, az REAL,
      gx REAL, gy REAL, gz REAL,

      latitude REAL,
      longitude REAL,
      speed_mps REAL,
      speed_kmph REAL,

      magnitude REAL,
      gyro_magnitude REAL,
      transport_mode TEXT
    );
  `);

  // Lightweight migration for existing installs (adds gyro_magnitude if missing)
  try {
    const cols = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(sensor_data);`
    );
    const hasGyroMagnitude = cols.some((c) => c.name === "gyro_magnitude");
    if (!hasGyroMagnitude) {
      await db.execAsync(`ALTER TABLE sensor_data ADD COLUMN gyro_magnitude REAL;`);
    }
  } catch {
    // If PRAGMA/ALTER fails for any reason, don't crash app startup.
    // Worst case: gyro_magnitude won't be stored until the table is recreated.
  }
}
