/* =====================================================================
   The local app: a Vite plugin that serves the API from the dev and
   preview servers, so `npm start` is all it takes. Data lives in one
   folder (data/ by default, or POKELEET_DATA_DIR):

     progress.json          game state: currencies, collection, team...
     library.json           your problems (with code) and custom tags
     solutions/<tag>/...    a copy of each solved problem's code
     backups/<date>/...     daily copies of the two JSON files
===================================================================== */
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getRequestListener } from '@hono/node-server'
import type { Plugin } from 'vite'
import type { Library } from '../../../shared/library.ts'
import { createApp } from '../app.ts'
import { fetchLeetCodeProblem } from '../leetcode.ts'
import { createFileStore } from '../stores/file-store.ts'
import { withSolutionFiles } from './solution-files.ts'

const LOCAL_USER = 'local'

export function createLocalApp(dataDir: string) {
  const backupsDir = path.join(dataDir, 'backups')
  const progress = createFileStore<object>({
    file: path.join(dataDir, 'progress.json'),
    owner: LOCAL_USER,
    backupsDir,
  })
  const library = withSolutionFiles(
    createFileStore<Library>({
      file: path.join(dataDir, 'library.json'),
      owner: LOCAL_USER,
      backupsDir,
    }),
    path.join(dataDir, 'solutions'),
  )
  return createApp({
    stores: { progress, library },
    identify: () => LOCAL_USER,
    lookup: fetchLeetCodeProblem,
    mode: 'local',
    location: dataDir,
  })
}

export function pokeleetApi({ dataDir = 'data' } = {}): Plugin {
  let handle: (req: IncomingMessage, res: ServerResponse, next: () => void) => void
  return {
    name: 'pokeleet-api',
    configResolved(config) {
      const listener = getRequestListener(createLocalApp(path.resolve(config.root, dataDir)).fetch)
      handle = (req, res, next) => (req.url?.startsWith('/api/') ? listener(req, res) : next())
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => handle(req, res, next))
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => handle(req, res, next))
    },
  }
}
