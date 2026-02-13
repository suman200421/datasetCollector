import { useEffect, useRef, useState } from "react";
import { Button, Pressable, Text, View } from "react-native";

import { dataBuffer } from "@/buffer/dataBuffer";
import { insertReadings } from "@/database/insert";
import { initDatabase } from "@/database/schema";
import { processRawData } from "@/processing/processRawData";

import { startAccelerometer } from "@/sensors/accelerometer";
import { startGyroscope } from "@/sensors/gyroscope";
import { startLocation } from "@/sensors/location";

import { useTransport } from "@/context/TransportContext";
import { SensorReading, TransportMode } from "@/types/sensor";

import { getAllSensorData } from "@/database/select";

import { clearAllFeatures } from "@/database/clearFeatures";
import { getAllDataForExport } from "@/database/exportSelect";
import { exportCsvToClipboard } from "@/export/exportCsvToClipboard";
import { toCsv } from "@/utils/toCsv";

// Haversine distance between two GPS points, in meters
function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
const MODES: TransportMode[] = [
  "train",
  "car",
  "bus",
  "bike",
  "walking",
  "standing",
  "auto",
];

export default function Home() {
  const { mode, setMode } = useTransport();

  const lastSavedRef = useRef<number>(0);
  const SAVE_INTERVAL_MS = 5000; // 5 seconds


  // keep latest sensor values here
  const latestRef = useRef({
    ax: 0, ay: 0, az: 0,
    gx: 0, gy: 0, gz: 0,
    latitude: null as number | null,
    longitude: null as number | null,
    speed_mps: 0 as number, // Default to 0 instead of null
    speed_kmph: 0 as number, // Default to 0 instead of null
  });

  // Track GPS history for speed calculation
  const gpsHistoryRef = useRef<{
    lat: number;
    lon: number;
    timestamp: number;
  }[]>([]);

  const modeRef = useRef<TransportMode>(mode);
  const [recording, setRecording] = useState(false);

  // keep transport mode updated without re-subscribing sensors
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    initDatabase();
  }, []);

  const accelSub = useRef<any>(null);
  const gyroSub = useRef<any>(null);
  const locationSub = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    if (recording) return;

    await clearAllFeatures();
    if (__DEV__) {
      console.log("🧹 Old dataset cleared");
    }
    lastSavedRef.current = 0;


    accelSub.current = startAccelerometer((a: any) => {
      latestRef.current.ax = a.x;
      latestRef.current.ay = a.y;
      latestRef.current.az = a.z;
    });

    gyroSub.current = startGyroscope((g: any) => {
      latestRef.current.gx = g.x;
      latestRef.current.gy = g.y;
      latestRef.current.gz = g.z;
    });

    // Reset GPS history when starting recording
    gpsHistoryRef.current = [];

    locationSub.current = await startLocation((l: any) => {
      const { latitude, longitude } = l.coords;
      const timestamp = l.timestamp ?? Date.now();

      // Only process valid GPS coordinates
      if (typeof latitude !== "number" || typeof longitude !== "number" || 
          isNaN(latitude) || isNaN(longitude)) {
        return;
      }

      latestRef.current.latitude = latitude;
      latestRef.current.longitude = longitude;

      // Calculate speed from GPS movement history (always use calculated speed)
      let speedMps = 0;
      const history = gpsHistoryRef.current;
      
      // Keep only last 5 GPS points (for rolling average)
      if (history.length >= 5) {
        history.shift();
      }

      // Add current point
      history.push({ lat: latitude, lon: longitude, timestamp });

      // Calculate speed from last 2 points if we have enough history
      if (history.length >= 2) {
        const last = history[history.length - 1];
        const prev = history[history.length - 2];
        
        const dtSec = (last.timestamp - prev.timestamp) / 1000;
        
        if (dtSec > 0.1 && dtSec < 10) { // Valid time difference (0.1s to 10s)
          const dist = haversineDistanceMeters(
            prev.lat,
            prev.lon,
            last.lat,
            last.lon
          );
          
          if (dist > 0) {
            speedMps = dist / dtSec;
            
            // Cap speed at reasonable maximum (200 km/h = 55.5 m/s)
            if (speedMps > 55.5) {
              speedMps = 55.5;
            }
          }
        }
      }

      // Always update speed (even if 0)
      latestRef.current.speed_mps = speedMps;
      latestRef.current.speed_kmph = speedMps * 3.6;

      if (__DEV__) {
        console.log(`📍 GPS: lat=${latitude.toFixed(6)}, lon=${longitude.toFixed(6)}, speed=${speedMps.toFixed(2)} m/s (${(speedMps * 3.6).toFixed(2)} km/h)`);
      }
    });

    // main sampling loop (every 5 seconds)
    timerRef.current = setInterval(async () => {
      const now = Date.now();

      // Ensure speed values are never null (default to 0)
      const speedMps = latestRef.current.speed_mps ?? 0;
      const speedKmph = latestRef.current.speed_kmph ?? 0;

      const reading: SensorReading = {
        timestamp: now,

        ax: latestRef.current.ax,
        ay: latestRef.current.ay,
        az: latestRef.current.az,

        gx: latestRef.current.gx,
        gy: latestRef.current.gy,
        gz: latestRef.current.gz,

        latitude: latestRef.current.latitude,
        longitude: latestRef.current.longitude,
        speed_mps: speedMps,
        speed_kmph: speedKmph,

        magnitude: 0,
        gyro_magnitude: 0,
        transport_mode: modeRef.current,
      };

      // Always collect (high-frequency)
      dataBuffer.add(reading);

      // ✅ SAVE ONLY EVERY 5 SECONDS
      if (now - lastSavedRef.current >= SAVE_INTERVAL_MS) {
        lastSavedRef.current = now;

        const batch = dataBuffer.flush();
        const processed = processRawData(batch);

        // save only ONE aggregated row
        const lastRow = processed[processed.length - 1];
        if (lastRow) {
          await insertReadings([lastRow]);
        }
      }
    }, 5000);


    setRecording(true);
  };



  const stopRecording = async () => {
    accelSub.current?.remove();
    gyroSub.current?.remove();
    locationSub.current?.remove();
    clearInterval(timerRef.current);

    setRecording(false);

    // 🔍 READ & LOG SQLITE DATA
    const rows = await getAllSensorData();
    if (__DEV__) {
      console.log("📦 SQLite sensor data:", rows);
    }
  };
  const exportToCsv = async () => {
    const rows = await getAllDataForExport();

    if (!rows.length) {
      if (__DEV__) {
        console.log("No data to export");
      }
      return;
    }

    const csv = toCsv(rows);        // ✅ USED HERE
    
    if (__DEV__) {
      // Debug: Show first row to verify speed formatting
      const firstRow = rows[0] as any;
      console.log("First row speed values:", {
        speed_mps: firstRow?.speed_mps,
        speed_kmph: firstRow?.speed_kmph,
      });
      console.log("CSV preview (first 200 chars):", csv.substring(0, 200));
    }
    
    await exportCsvToClipboard(csv);
  };



  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, marginBottom: 10 }}>
        Motion Data Logger
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 6 }}>
        Transport Mode
      </Text>

      {MODES.map((m) => (
        <Pressable
          key={m}
          onPress={() => {
            setMode(m);
            modeRef.current = m;
          }}
          style={{
            padding: 10,
            borderRadius: 8,
            marginVertical: 4,
            backgroundColor: mode === m ? "#4CAF50" : "#ddd",
          }}
        >
          <Text>{m.toUpperCase()}</Text>
        </Pressable>
      ))}


      <View style={{ height: 20 }} />

      {!recording ? (
        <Button title="Start Recording" onPress={startRecording} />
      ) : (
        <Button title="Stop Recording" onPress={stopRecording} color="red" />
      )}
      <Button title="Export CSV (Clipboard)" onPress={exportToCsv} />
    </View>
  );
}