export type HapticIntensity = 'light' | 'medium' | 'success' | 'celebrate'

const PATTERNS: Record<HapticIntensity, number | number[]> = {
  light: 10,
  medium: 20,
  success: [15, 40, 15],
  celebrate: [20, 60, 20, 60, 40],
}

export function haptic(intensity: HapticIntensity = 'light') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  navigator.vibrate(PATTERNS[intensity])
}
