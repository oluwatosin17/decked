import { readFile, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'

const roots = ['dist']
const findings = []
const forbiddenNames = /(?:VITE_)?SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/
const secretKey = /sb_secret_[A-Za-z0-9_-]{20,}/
const jwt = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g

async function files(directory) {
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) result.push(...await files(path))
    else if (['.js', '.mjs', '.html', '.css', '.json'].includes(extname(path))) result.push(path)
  }
  return result
}

for (const root of roots) {
  for (const path of await files(root)) {
    const source = await readFile(path, 'utf8')
    if (forbiddenNames.test(source)) findings.push(`${path}: service-role environment variable name`)
    if (secretKey.test(source)) findings.push(`${path}: Supabase secret key`)
    for (const candidate of source.match(jwt) ?? []) {
      try {
        const payload = JSON.parse(Buffer.from(candidate.split('.')[1], 'base64url').toString('utf8'))
        if (payload.role === 'service_role') findings.push(`${path}: legacy service-role JWT`)
      } catch { /* Non-JWT minified text. */ }
    }
  }
}

if (findings.length) {
  console.error(findings.join('\n'))
  process.exitCode = 1
} else {
  console.log('Browser bundle secret audit passed: no Supabase service-role credential found.')
}
