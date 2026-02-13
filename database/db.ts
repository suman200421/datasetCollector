import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";

let db: SQLiteDatabase | null = null;

export async function getDb() {
  if (!db) {
    db = await openDatabaseAsync("motion_data.db");
  }
  return db;
}
