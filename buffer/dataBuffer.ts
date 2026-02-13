import { SensorReading } from "@/types/sensor";

class DataBuffer {
  private buffer: SensorReading[] = [];
  private maxSize = 30;

  add(data: SensorReading) {
    this.buffer.push(data);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  ready() {
    return this.buffer.length >= this.maxSize;
  }

  flush() {
    const data = [...this.buffer];
    this.buffer = [];
    return data;
  }
}

export const dataBuffer = new DataBuffer();
