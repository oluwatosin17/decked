import { describe, expect, it } from 'vitest'
import { detectInstallPlatform, isInstalledDisplayMode, isInstallPromptDismissed } from './installPromptModel'

describe('install prompt platform detection', () => {
  it('recognises Android browsers', () => {
    expect(detectInstallPlatform('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36')).toBe('android')
  })

  it('recognises Safari on iPhone and iPadOS', () => {
    expect(detectInstallPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1')).toBe('ios')
    expect(detectInstallPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1', 5)).toBe('ios')
  })

  it('does not show Safari instructions in other iOS browsers or on desktop', () => {
    expect(detectInstallPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) CriOS/140 Mobile/15E148 Safari/604.1')).toBeNull()
    expect(detectInstallPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15')).toBeNull()
  })
})

describe('install prompt visibility helpers', () => {
  it('recognises either standalone signal', () => {
    expect(isInstalledDisplayMode(true, false)).toBe(true)
    expect(isInstalledDisplayMode(false, true)).toBe(true)
    expect(isInstalledDisplayMode(false, false)).toBe(false)
  })

  it('keeps a dismissal quiet for fourteen days', () => {
    const now = Date.UTC(2026, 9, 28)
    expect(isInstallPromptDismissed(String(now - 13 * 24 * 60 * 60 * 1000), now)).toBe(true)
    expect(isInstallPromptDismissed(String(now - 15 * 24 * 60 * 60 * 1000), now)).toBe(false)
    expect(isInstallPromptDismissed(null, now)).toBe(false)
  })
})
