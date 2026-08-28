export type ScaleMode = 'linear' | 'log'

export function normalizeScalarRange(
  values: readonly number[],
  min: number,
  max: number,
  scale: ScaleMode = 'linear',
  missingValue = -9999,
): Float32Array {
  if (!(max > min)) throw new Error('max must be greater than min')
  const result = new Float32Array(values.length)
  const logMin = Math.log10(Math.max(min, Number.EPSILON))
  const logMax = Math.log10(Math.max(max, Number.EPSILON))
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i]
    if (!Number.isFinite(value) || value === missingValue) {
      result[i] = 0
      continue
    }
    if (scale === 'log') {
      if (value <= 0 || min <= 0) {
        result[i] = 0
        continue
      }
      result[i] = Math.min(1, Math.max(0, (Math.log10(value) - logMin) / (logMax - logMin)))
    } else {
      result[i] = Math.min(1, Math.max(0, (value - min) / (max - min)))
    }
  }
  return result
}
