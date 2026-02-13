import { SensorReading } from "@/types/sensor";
export function movingAverage(data: SensorReading[], window = 5) {
     return data.map((_, i, arr) => {
        const slice = arr.slice(Math.max(0, i - window + 1), i + 1);
         const avg = (k: keyof SensorReading) => slice.reduce((s, v) => s + (v[k] as number), 0) / slice.length; 
         return { 
            ...arr[i], 
            ax: avg("ax"), 
            ay: avg("ay"), 
            az: avg("az"), 
        }; 
    }); 
}