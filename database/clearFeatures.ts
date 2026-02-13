import { getDb } from "./db";

export async function clearAllFeatures() {
  const db = await getDb();
  await db.execAsync("DELETE FROM sensor_data;");
}
