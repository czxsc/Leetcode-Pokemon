// The app's screen must fill the window inside its margin (on a wide monitor,
// the height, centred), and the desktop layout must never get less width than
// it was designed for, nor more than its maximum.
import { describe, expect, it } from 'vitest'
import { screenMargin, screenSize } from './screen-size'

// the space inside the margin
const space = (w, h) => {
  const m = screenMargin(w, h)
  return { width: w - 2 * m, height: h - 2 * m, margin: m }
}

describe('screenMargin', () => {
  it('leaves a little backdrop on a phone and more on a big monitor, within limits', () => {
    expect(screenMargin(390, 844)).toBe(12)
    expect(screenMargin(1280, 800)).toBe(24)
    expect(screenMargin(3840, 2160)).toBe(32)
    expect(screenMargin(200, 150)).toBe(8)
  })
})

describe('screenSize', () => {
  it('fills the space when it is no wider than the widest layout', () => {
    const s = space(1300, 1000)
    const { width, height, scale, left, top } = screenSize(1300, 1000)
    expect([left, top]).toEqual([s.margin, s.margin])
    expect(width * scale).toBeCloseTo(s.width)
    expect(height * scale).toBeCloseTo(s.height)
  })

  it('on a wide monitor, scales up to the full height and leaves the extra width to the backdrop', () => {
    const s = space(1920, 1080)
    const { width, height, scale, left, top } = screenSize(1920, 1080)
    expect(scale).toBeCloseTo(s.height / 800)
    expect(height).toBeCloseTo(800)
    expect(width).toBe(1360)
    expect(top).toBe(s.margin)
    expect(left).toBeCloseTo((1920 - width * scale) / 2) // centred
    expect(left).toBeGreaterThan(90) // about the old fixed screen's side bars
  })

  it('scales down on a laptop, keeping the desktop layout', () => {
    const s = space(1366, 700)
    const { width, height, scale } = screenSize(1366, 700)
    expect(scale).toBeCloseTo(s.height / 800)
    expect(height).toBeCloseTo(800)
    expect(width).toBeGreaterThan(1280)
  })

  it('stops scaling down at the smallest readable size', () => {
    const { height, scale } = screenSize(1366, 500)
    expect(scale).toBe(0.8)
    expect(height).toBeCloseTo(space(1366, 500).height / 0.8)
  })

  it('uses real pixels when the space is narrower than the desktop layout', () => {
    for (const [w, h] of [
      [1023, 768],
      [390, 844],
      [844, 390],
    ]) {
      const s = space(w, h)
      expect(screenSize(w, h)).toEqual({
        width: s.width,
        height: s.height,
        scale: 1,
        left: s.margin,
        top: s.margin,
      })
    }
  })

  it('switches to the desktop layout once the space is the narrowest desktop width', () => {
    const w = 1024 + 2 * screenMargin(1100, 768)
    expect(space(w, 768).width).toBe(1024)
    const { width, scale } = screenSize(w, 768)
    expect(scale).toBeCloseTo(0.8)
    expect(width).toBeCloseTo(1280)
    expect(screenSize(w - 1, 768).scale).toBe(1)
  })

  // sizes are chosen to trip floating-point error in width / scale
  it.each([
    [1100, 600],
    [1100, 640],
    [1100, 900],
    [1279, 800],
    [1366, 768],
    [1536, 730],
    [1920, 1200],
    [2560, 1080],
    [3840, 2160],
  ])('fits a %i x %i window: full height, centred, the design width at least', (w, h) => {
    const s = space(w, h)
    const { width, height, scale, left } = screenSize(w, h)
    expect(height * scale).toBeCloseTo(s.height, 6)
    expect(width * scale).toBeLessThanOrEqual(s.width + 1e-6)
    expect(left * 2 + width * scale).toBeCloseTo(w, 6)
    // theme.css's narrow layout tops out at 1023, well under any rounding error
    expect(width).toBeGreaterThan(1279.99)
    expect(width).toBeLessThanOrEqual(1360)
  })
})
