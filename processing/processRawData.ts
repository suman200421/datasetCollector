import { highpassFilter } from "@/filters/highpass";
import { lowpassFilter } from "@/filters/lowpass";
import { thresholdFilter } from "@/filters/threshold";
import { SensorReading } from "@/types/sensor";

/**
 * Complementary filter: Blends high-pass gyro (quick changes) with low-pass accel (slow drift)
 * This provides better feature extraction for ML models by:
 * - Low-pass accel: Captures steady motion patterns, reduces vibration noise
 * - High-pass gyro: Captures rapid orientation changes, removes drift
 */
export function processRawData(data: SensorReading[]) {
  // Step 1: Apply low-pass filter to accelerometer (removes noise, preserves slow drift)
  // Alpha 0.45: Optimized for mobile - balances noise reduction with motion pattern preservation
  let out = lowpassFilter(data, 0.45);
  
  // Step 2: Apply high-pass filter to gyroscope (removes drift, preserves quick changes)
  // Alpha 0.9: Strong drift removal while preserving rapid orientation changes
  out = highpassFilter(out, 0.9);
  
  // Step 3: Apply threshold filter to remove small noise values
  out = thresholdFilter(out);

  // Step 4: Calculate magnitudes from filtered values
  return out.map(d => ({
    ...d,
    magnitude: Math.sqrt(d.ax ** 2 + d.ay ** 2 + d.az ** 2),
    gyro_magnitude: Math.sqrt(d.gx ** 2 + d.gy ** 2 + d.gz ** 2),
  }));
}
