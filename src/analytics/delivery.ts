export interface DeliveryLifecycleTarget {
  addEventListener(type: string, listener: () => void): void
  removeEventListener(type: string, listener: () => void): void
}

/**
 * Mobile browsers frequently suspend timers when a tab is backgrounded. Flush
 * the persisted queue again whenever connectivity or page activity changes.
 */
export function installAnalyticsDeliveryRecovery(
  flush: () => void,
  windowTarget: DeliveryLifecycleTarget,
  documentTarget: DeliveryLifecycleTarget & { visibilityState?: string },
) {
  const onOnline = () => flush()
  const onPageHide = () => flush()
  const onVisibility = () => {
    if (documentTarget.visibilityState === 'visible' || documentTarget.visibilityState === 'hidden') flush()
  }

  windowTarget.addEventListener('online', onOnline)
  windowTarget.addEventListener('pageshow', onOnline)
  windowTarget.addEventListener('pagehide', onPageHide)
  documentTarget.addEventListener('visibilitychange', onVisibility)

  return () => {
    windowTarget.removeEventListener('online', onOnline)
    windowTarget.removeEventListener('pageshow', onOnline)
    windowTarget.removeEventListener('pagehide', onPageHide)
    documentTarget.removeEventListener('visibilitychange', onVisibility)
  }
}
