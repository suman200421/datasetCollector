import { SensorReading } from "@/types/sensor";

/**
 * High-pass filter using first-order IIR filter
 * Removes slow drift and DC bias, preserves quick changes
 * Ideal for gyroscope to detect rapid orientation changes
 * 
 * @param data - Array of sensor readings
 * @param alpha - Filter coefficient (0-1). Higher = more high-pass filtering
 *                 Default 0.9 - optimized for mobile gyroscope (removes drift, preserves quick changes)
 *                 Range: 0.7-0.95 (higher = stronger drift removal, lower = preserves more low-freq)
 * @returns Filtered sensor readings with high-pass filtered gyroscope values
 */
export function highpassFilter(
  data: SensorReading[],
  alpha: number = 0.9
): SensorReading[] {
  if (data.length === 0) return data;

  const filtered: SensorReading[] = [];
  
  // Initialize with first reading (no high-pass for first sample)
  let prevGx = data[0].gx;
  let prevGy = data[0].gy;
  let prevGz = data[0].gz;
  let prevGxOut = data[0].gx;
  let prevGyOut = data[0].gy;
  let prevGzOut = data[0].gz;

  for (const reading of data) {
    // High-pass filter: y[n] = α * (y[n-1] + x[n] - x[n-1])
    // This removes slow drift and preserves quick changes
    const filteredGx = alpha * (prevGxOut + reading.gx - prevGx);
    const filteredGy = alpha * (prevGyOut + reading.gy - prevGy);
    const filteredGz = alpha * (prevGzOut + reading.gz - prevGz);

    filtered.push({
      ...reading,
      gx: filteredGx,
      gy: filteredGy,
      gz: filteredGz,
    });

    // Update previous values for next iteration
    prevGx = reading.gx;
    prevGy = reading.gy;
    prevGz = reading.gz;
    prevGxOut = filteredGx;
    prevGyOut = filteredGy;
    prevGzOut = filteredGz;
  }

  return filtered;
}
