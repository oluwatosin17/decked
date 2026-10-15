import { track } from './index'
import type { MultiplayerGameId } from '../multiplayer/types'

export type PerformanceMetric = 'ttfb' | 'dom_content_loaded' | 'load_complete' | 'first_contentful_paint' | 'largest_contentful_paint' | 'interaction_to_next_paint' | 'multiplayer_sync'
type PerformanceRating = 'good' | 'needs_improvement' | 'poor'

let captured = false
const thresholds: Record<PerformanceMetric, readonly [number, number]> = {
  ttfb: [800, 1800], dom_content_loaded: [1800, 3500], load_complete: [2500, 4000],
  first_contentful_paint: [1800, 3000], largest_contentful_paint: [2500, 4000],
  interaction_to_next_paint: [200, 500], multiplayer_sync: [500, 1500],
}

export function performanceRating(metric: PerformanceMetric, value: number): PerformanceRating {
  const [good, poor] = thresholds[metric]
  return value <= good ? 'good' : value <= poor ? 'needs_improvement' : 'poor'
}

export function trackPerformance(metric: PerformanceMetric, value: number, extra: { game_id?: MultiplayerGameId; retry_count?: number } = {}) {
  if (!Number.isFinite(value) || value < 0) return
  track('performance_measured', { metric_name: metric, duration_ms: Math.round(value), rating: performanceRating(metric, value), ...extra })
}

export function captureNavigationPerformance() {
  if (captured || typeof window === 'undefined' || typeof performance === 'undefined') return
  captured = true
  const reported = new Set<PerformanceMetric>()
  const observers: PerformanceObserver[] = []
  let largestContentfulPaint = 0
  let interactionToNextPaint = 0

  const reportOnce = (metric: PerformanceMetric, value: number) => {
    if (reported.has(metric) || !Number.isFinite(value) || value < 0) return
    reported.add(metric)
    trackPerformance(metric, value)
  }
  const observe = (options: PerformanceObserverInit, onEntries: (entries: PerformanceEntry[]) => void) => {
    if (typeof PerformanceObserver === 'undefined') return
    try {
      const observer = new PerformanceObserver(list => onEntries(list.getEntries()))
      observer.observe(options)
      observers.push(observer)
    } catch { /* Unsupported metrics are intentionally omitted on older browsers. */ }
  }
  const captureNavigation = () => {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (!entry) return
    reportOnce('ttfb', entry.responseStart)
    reportOnce('dom_content_loaded', entry.domContentLoadedEventEnd)
    reportOnce('load_complete', entry.loadEventEnd)
  }

  const existingFcp = performance.getEntriesByName('first-contentful-paint')[0]
  if (existingFcp) reportOnce('first_contentful_paint', existingFcp.startTime)
  observe({ type: 'paint', buffered: true }, entries => {
    const fcp = entries.find(entry => entry.name === 'first-contentful-paint')
    if (fcp) reportOnce('first_contentful_paint', fcp.startTime)
  })
  observe({ type: 'largest-contentful-paint', buffered: true }, entries => {
    const latest = entries[entries.length - 1]
    if (latest) largestContentfulPaint = Math.max(largestContentfulPaint, latest.startTime)
  })
  observe({ type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit, entries => {
    for (const entry of entries) {
      const interaction = entry as PerformanceEntry & { duration?: number; interactionId?: number }
      if ((interaction.interactionId ?? 0) > 0) interactionToNextPaint = Math.max(interactionToNextPaint, interaction.duration ?? 0)
    }
  })
  const finalize = () => {
    if (largestContentfulPaint > 0) reportOnce('largest_contentful_paint', largestContentfulPaint)
    if (interactionToNextPaint > 0) reportOnce('interaction_to_next_paint', interactionToNextPaint)
    observers.forEach(observer => observer.disconnect())
  }
  if (document.readyState === 'complete') window.setTimeout(captureNavigation, 0)
  else window.addEventListener('load', captureNavigation, { once: true })
  window.addEventListener('pagehide', finalize, { once: true })
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') finalize() }, { once: true })
}
