import { describe, it, expect } from 'vitest'
import {
  hurstToFractalDimension,
  classifyFractalDimension,
  fractalRegimeLabel,
} from './fractalDimension'

describe('hurstToFractalDimension', () => {
  it('H=0.6 → D=1.4', () => {
    expect(hurstToFractalDimension(0.6)).toBeCloseTo(1.4, 10)
  })

  it('H=0.5 → D=1.5', () => {
    expect(hurstToFractalDimension(0.5)).toBeCloseTo(1.5, 10)
  })

  it('H=0.3 → D=1.7', () => {
    expect(hurstToFractalDimension(0.3)).toBeCloseTo(1.7, 10)
  })

  it('H=NaN → D=NaN', () => {
    expect(hurstToFractalDimension(NaN)).toBeNaN()
  })

  it('H=0 → D=2 (邊界)', () => {
    expect(hurstToFractalDimension(0)).toBe(2)
  })

  it('H=1 → D=1 (邊界)', () => {
    expect(hurstToFractalDimension(1)).toBe(1)
  })
})

describe('classifyFractalDimension', () => {
  it('D < 1.4 → strong-trend', () => {
    expect(classifyFractalDimension(1.0)).toBe('strong-trend')
    expect(classifyFractalDimension(1.39)).toBe('strong-trend')
    expect(classifyFractalDimension(1.399)).toBe('strong-trend')
  })

  it('1.4 ≤ D < 1.48 → mild-trend', () => {
    expect(classifyFractalDimension(1.4)).toBe('mild-trend')
    expect(classifyFractalDimension(1.45)).toBe('mild-trend')
    expect(classifyFractalDimension(1.479)).toBe('mild-trend')
  })

  it('1.48 ≤ D ≤ 1.52 → random', () => {
    expect(classifyFractalDimension(1.48)).toBe('random')
    expect(classifyFractalDimension(1.5)).toBe('random')
    expect(classifyFractalDimension(1.52)).toBe('random')
  })

  it('1.52 < D ≤ 1.6 → mild-mean-revert', () => {
    expect(classifyFractalDimension(1.521)).toBe('mild-mean-revert')
    expect(classifyFractalDimension(1.55)).toBe('mild-mean-revert')
    expect(classifyFractalDimension(1.6)).toBe('mild-mean-revert')
  })

  it('D > 1.6 → strong-mean-revert', () => {
    expect(classifyFractalDimension(1.61)).toBe('strong-mean-revert')
    expect(classifyFractalDimension(1.8)).toBe('strong-mean-revert')
    expect(classifyFractalDimension(2)).toBe('strong-mean-revert')
  })

  it('NaN → random (預設)', () => {
    expect(classifyFractalDimension(NaN)).toBe('random')
  })
})

describe('fractalRegimeLabel', () => {
  it('returns Chinese labels for all 5 regimes', () => {
    expect(fractalRegimeLabel('strong-trend')).toBe('強趨勢延續')
    expect(fractalRegimeLabel('mild-trend')).toBe('偏趨勢')
    expect(fractalRegimeLabel('random')).toBe('接近隨機')
    expect(fractalRegimeLabel('mild-mean-revert')).toBe('偏均值回歸')
    expect(fractalRegimeLabel('strong-mean-revert')).toBe('強均值回歸')
  })
})
