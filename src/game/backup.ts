/* =====================================================================
   Backup files (Dashboard -> Data): the two saved documents in one JSON
   file. Import also accepts backups from the old localStorage-only app.
===================================================================== */
import { importLegacyState, isLegacyState } from './legacy-import'
import { splitState } from './state'
import type { GameState, Library } from './types'

const BACKUP_TYPE = 'pokeleet-backup'
const BACKUP_VERSION = 2

export function exportBackup(state: GameState, exportedAt: string): string {
  const { progress, library } = splitState(state)
  return JSON.stringify(
    { type: BACKUP_TYPE, version: BACKUP_VERSION, exportedAt, progress, library },
    null,
    2,
  )
}

// -> the documents to load (still to be normalized by buildState); throws on an unusable file
export function parseBackup(raw: string, currentLibrary: Library) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new Error('Backup file is not valid JSON.', { cause: err })
  }
  if (
    parsed?.type === BACKUP_TYPE &&
    parsed.version === BACKUP_VERSION &&
    parsed.progress &&
    parsed.library
  ) {
    return { progress: parsed.progress, library: parsed.library }
  }
  // backups from the old localStorage-only version
  const legacy = parsed?.type === BACKUP_TYPE ? parsed.state : parsed
  if (!isLegacyState(legacy)) throw new Error('Backup format is not supported by this version.')
  return importLegacyState(legacy, currentLibrary)
}
