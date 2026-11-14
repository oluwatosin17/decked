// Local-only proxy for a disposable PostgREST container during browser QA.
// It never connects to the Decked Supabase project.
import http from 'node:http'

const host = '127.0.0.1'
const port = 54321
const upstream = 'http://127.0.0.1:3002'

http.createServer((request, response) => {
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': 'authorization, apikey, content-type, prefer, x-client-info, accept, accept-profile, content-profile',
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204, cors)
    response.end()
    return
  }
  if (!request.url?.startsWith('/rest/v1/')) {
    response.writeHead(404, cors)
    response.end()
    return
  }
  const target = new URL(request.url.slice('/rest/v1'.length), upstream)
  const headers = { ...request.headers }
  delete headers.host
  const proxy = http.request(target, { method: request.method, headers }, upstreamResponse => {
    response.writeHead(upstreamResponse.statusCode ?? 502, { ...upstreamResponse.headers, ...cors })
    upstreamResponse.pipe(response)
  })
  proxy.on('error', error => {
    response.writeHead(502, { ...cors, 'content-type': 'application/json' })
    response.end(JSON.stringify({ message: error.message }))
  })
  request.pipe(proxy)
}).listen(port, host, () => {
  process.stdout.write(`Local QA API proxy listening on http://${host}:${port}\n`)
})
