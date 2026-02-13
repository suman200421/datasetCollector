export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function std(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  const variance =
    values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function rms(values: number[]): number {
  if (!values.length) return 0;
  const sq =
    values.reduce((sum, v) => sum + v * v, 0) / values.length;
  return Math.sqrt(sq);
}
