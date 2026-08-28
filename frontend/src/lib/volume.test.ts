import { describe, expect, it } from 'vitest'
import { normalizeScalarRange } from './volume'

describe('normalizeScalarRange', () => {
  it('maps finite values into 0..1 and missing values to zero', () => {
    expect(Array.from(normalizeScalarRange([0, 5, 10, -9999], 0, 10, 'linear', -9999))).toEqual([0, 0.5, 1, 0])
  })
  it('supports logarithmic normalization for positive ranges', () => {
    const result = Array.from(normalizeScalarRange([1, 10, 100], 1, 100, 'log', -9999))
    expect(result[0]).toBeCloseTo(0)
    expect(result[1]).toBeCloseTo(0.5)
    expect(result[2]).toBeCloseTo(1)
  })
})
