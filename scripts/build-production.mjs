import { spawnSync } from 'node:child_process'

function gitRevision() {
  const result = spawnSync('git', ['rev-parse', '--short=12', 'HEAD'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })
  return result.status === 0 ? result.stdout.trim() : ''
}

const appVersion = process.env.VITE_APP_VERSION
  || process.env.CF_VERSION_METADATA_ID
  || process.env.CF_PAGES_COMMIT_SHA
  || gitRevision()

if (!appVersion) {
  console.error('Production build requires a stable VITE_APP_VERSION or Git revision.')
  process.exit(1)
}

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const result = spawnSync(command, ['run', 'build'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    VITE_ANALYTICS_ENABLED: 'true',
    VITE_ANALYTICS_ENVIRONMENT: 'production',
    VITE_APP_VERSION: appVersion,
  },
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
