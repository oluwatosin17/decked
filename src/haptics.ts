export type HapticIntensity = 'light' | 'medium' | 'success'

const PATTERNS: Record<HapticIntensity, number | number[]> = {
  light: 10,
  medium: 20,
  success: [15, 40, 15],
}

export function haptic(intensity: HapticIntensity = 'light') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  navigator.vibrate(PATTERNS[intensity])
}
