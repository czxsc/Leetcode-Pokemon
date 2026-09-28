/* =====================================================================
   Vite plugin that serves the storage API from the dev and preview
   servers, so `npm run dev` is all it takes to save progress to disk.

     GET /api/data            -> { progress, library, dataDir }
     PUT /api/progress        <- { rev, data }   -> { rev, savedAt }
     PUT /api/library         <- { rev, data }   -> { rev, savedAt, warning }
===================================================================== */
import path from 'node:path'
import { createStorage } from './storage.js'

const MAX_BODY_BYTES = 20 * 1024 * 1024

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify({ api: 'pokeleet', ...body }))
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body is too large'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(Object.assign(new Error('Request body is not valid JSON'), { status: 400 }))
      }
    })
    req.on('error', reject)
  })
}

export function createApiMiddleware(storage) {
  async function handle(req, res, pathname) {
    if (pathname === '/api/data' && req.method === 'GET') {
      const { progress, library } = await storage.load()
      return send(res, 200, { dataDir: storage.dataDir, progress, library })
    }
    const match = pathname.match(/^\/api\/(progress|library)$/)
    if (match && req.method === 'PUT') {
      if (!String(req.headers['content-type'] || '').includes('application/json')) {
        return send(res, 415, { error: 'Expected a JSON body' })
      }
      const body = await readJsonBody(req)
      const result = await storage.save(match[1], body && body.data, body && body.rev)
      return send(res, 200, result)
    }
    return send(res, 404, { error: `No API route for ${req.method} ${pathname}` })
  }

  return function pokeleetApi(req, res, next) {
    const pathname = new URL(req.url, 'http://localhost').pathname
    if (!pathname.startsWith('/api/')) return next()
    handle(req, res, pathname).catch((err) => {
      const status = err.status || 500
      if (status >= 500) console.error('[pokeleet-storage]', err)
      send(res, status, { error: err.message, rev: err.rev })
    })
  }
}

export default function pokeleetStorage({ dataDir = 'data' } = {}) {
  let middleware
  return {
    name: 'pokeleet-storage',
    configResolved(config) {
      const dir = path.resolve(config.root, dataDir)
      middleware = createApiMiddleware(createStorage(dir))
    },
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
