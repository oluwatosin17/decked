export type InstallPlatform = 'android' | 'ios' | null

export const INSTALL_PROMPT_DISMISS_KEY = 'decked:install-prompt-dismissed-at'
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000

export function detectInstallPlatform(userAgent: string, maxTouchPoints = 0): InstallPlatform {
  const iosDevice = /iPad|iPhone|iPod/i.test(userAgent)
    || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)
  const iosSafari = iosDevice
    && /Safari/i.test(userAgent)
    && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent)

  if (iosSafari) return 'ios'
  if (/Android/i.test(userAgent)) return 'android'
  return null
}

export function isInstalledDisplayMode(
  standaloneMedia: boolean,
  navigatorStandalone = false,
): boolean {
  return standaloneMedia || navigatorStandalone
}

export function isInstallPromptDismissed(value: string | null, now = Date.now()): boolean {
  if (!value) return false
  const dismissedAt = Number(value)
  return Number.isFinite(dismissedAt) && now - dismissedAt < DISMISS_COOLDOWN_MS
}
