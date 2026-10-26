/* =====================================================================
   A user's data is two documents: game progress and the problem
   library. Each store keeps one kind of document per user, with a
   revision number: a save names the revision it was based on, so a stale
   tab (or device) can never overwrite newer data.
===================================================================== */

export interface StoredDoc<T> {
  rev: number
  savedAt: string | null
  data: T
}

export interface SaveResult {
  rev: number
  savedAt: string
  warning?: string | null // saved, but something secondary failed (local solution files)
}

export interface DocumentStore<T> {
  load(userId: string): Promise<StoredDoc<T> | null>
  // Throws ConflictError unless the stored revision is still `baseRev` (0 = not saved yet).
  save(userId: string, data: T, baseRev: number): Promise<SaveResult>
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
  }
}

export class ConflictError extends HttpError {
  constructor(readonly rev: number) {
    super(409, 'Your data was changed from another tab or window.')
  }
}

// The cloud database answers this while it resumes from a pause; the web app retries.
export class UnavailableError extends HttpError {
  constructor(options?: ErrorOptions) {
    super(503, 'The database is waking up. Try again in a few seconds.', options)
  }
}
