import { SensorReading } from "@/types/sensor";

/**
 * Lowpass filter using exponential moving average (IIR filter)
 * Removes high-frequency noise, preserves slow drift
 * Ideal for accelerometer to detect steady motion patterns
 * 
 * @param data - Array of sensor readings
 * @param alphaAccel - Smoothing factor for accelerometer (0-1). Lower = more smoothing
 *                     Default 0.45 - optimized for mobile (10Hz sampling, balances noise reduction vs responsiveness)
 *                     Range: 0.3-0.6 (lower = more smoothing, higher = more responsive)
 * @returns Filtered sensor readings with low-pass filtered accelerometer values only
 */
export function lowpassFilter(
  data: SensorReading[],
  alphaAccel: number = 0.45
): SensorReading[] {
  if (data.length === 0) return data;

  const filtered: SensorReading[] = [];
  
  // Initialize with first reading
  let prevAx = data[0].ax;
  let prevAy = data[0].ay;
  let prevAz = data[0].az;

  for (const reading of data) {
    // Apply lowpass filter to accelerometer only: y[n] = α * x[n] + (1 - α) * y[n-1]
    // This removes high-frequency noise and preserves slow drift
    const filteredAx = alphaAccel * reading.ax + (1 - alphaAccel) * prevAx;
    const filteredAy = alphaAccel * reading.ay + (1 - alphaAccel) * prevAy;
    const filteredAz = alphaAccel * reading.az + (1 - alphaAccel) * prevAz;

    filtered.push({
      ...reading,
      ax: filteredAx,
      ay: filteredAy,
      az: filteredAz,
      // Keep gyroscope unchanged (will be high-pass filtered separately)
    });

    // Update previous values for next iteration
    prevAx = filteredAx;
    prevAy = filteredAy;
    prevAz = filteredAz;
  }

  return filtered;
}
