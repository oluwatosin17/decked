/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYTICS_ENABLED?: string
  readonly VITE_ANALYTICS_ENVIRONMENT?: 'development' | 'preview' | 'production'
  readonly VITE_APP_VERSION?: string
  readonly VITE_VERCEL_GIT_COMMIT_SHA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
