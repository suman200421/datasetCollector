import { SensorReading } from "@/types/sensor";
import { getDb } from "./db";

export async function getAllSensorData(): Promise<SensorReading[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<SensorReading>(
    `SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 20`
  );

  return rows;
}
