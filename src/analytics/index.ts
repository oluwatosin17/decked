import { AnalyticsClient } from './client'
import { isAnalyticsEnvironment } from './schema'
import type { AnalyticsEnvironment, AnalyticsEventName, AnalyticsEventProperties } from './types'

const configuredEnvironment = import.meta.env.VITE_ANALYTICS_ENVIRONMENT
const environment: AnalyticsEnvironment = configuredEnvironment && isAnalyticsEnvironment(configuredEnvironment)
  ? configuredEnvironment
  : import.meta.env.PROD ? 'production' : 'development'
const configuredAppVersion = import.meta.env.VITE_APP_VERSION || import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA
const appVersion = configuredAppVersion || 'local'
const deferredTransport = {
  async send(events: Parameters<import('./client').AnalyticsTransport['send']>[0]) {
    const { serverAnalyticsTransport, supabaseAnalyticsTransport } = await import('./transport')
    return import.meta.env.DEV ? supabaseAnalyticsTransport.send(events) : serverAnalyticsTransport.send(events)
  },
}

const client = new AnalyticsClient({
  enabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true'
    && typeof configuredEnvironment === 'string'
    && isAnalyticsEnvironment(configuredEnvironment)
    && (environment === 'development' || Boolean(configuredAppVersion)),
  environment,
  appVersion,
  transport: deferredTransport,
  storage: typeof window === 'undefined' ? undefined : window.localStorage,
  viewportWidth: () => typeof window === 'undefined' ? undefined : window.innerWidth,
  diagnostic: (message, detail) => console.debug(message, detail),
})

/** The single application-facing analytics API. It never throws or blocks gameplay. */
export function track<Name extends AnalyticsEventName>(name: Name, properties: AnalyticsEventProperties[Name]) {
  try { return client.track(name, properties) } catch (error) {
    if (environment === 'development') console.debug('[analytics] unexpected_tracking_failure', error)
    return null
  }
}

/** Retry any persisted events without delaying the player journey. */
export function flushAnalytics() { return client.flush() }

export type { AnalyticsEventName, AnalyticsEventProperties } from './types'
