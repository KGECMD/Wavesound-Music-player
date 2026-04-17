// IndexedDB-backed local library for Wavesound.
//
// Stores:
//   • favorites         — tracks the user saved (keyed by id)
//   • recentlyPlayed    — last N tracks played (keyed by id, sorted by playedAt)
//   • playCounts        — { id, count, lastPlayed } per track for "top played"
//   • queue             — persisted play queue
//   • settings          — misc key/value (e.g. preferred quality)
//
// Only imported in client components. All methods are safe to call on the
// server — they resolve to empty results when IndexedDB is unavailable.

'use client'

import type { StreamQuality, Track } from './types'

const DB_NAME = 'wavesound'
const DB_VERSION = 1

const STORES = {
  favorites: 'favorites',
  recentlyPlayed: 'recentlyPlayed',
  playCounts: 'playCounts',
  queue: 'queue',
  settings: 'settings',
} as const

export interface RecentPlay extends Track {
  playedAt: number
}

export interface PlayCount {
  id: string
  track: Track
  count: number
  lastPlayed: number
}

export interface QueueEntry extends Track {
  position: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'))
  }
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORES.favorites)) {
        db.createObjectStore(STORES.favorites, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.recentlyPlayed)) {
        const s = db.createObjectStore(STORES.recentlyPlayed, { keyPath: 'id' })
        s.createIndex('playedAt', 'playedAt')
      }
      if (!db.objectStoreNames.contains(STORES.playCounts)) {
        const s = db.createObjectStore(STORES.playCounts, { keyPath: 'id' })
        s.createIndex('count', 'count')
      }
      if (!db.objectStoreNames.contains(STORES.queue)) {
        db.createObjectStore(STORES.queue, { keyPath: 'position' })
      }
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'))
  })
  return dbPromise
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode)
        const objectStore = transaction.objectStore(store)
        let result: T
        Promise.resolve(run(objectStore))
          .then((r) => {
            result = r
          })
          .catch(reject)
        transaction.oncomplete = () => resolve(result)
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('indexedDB tx error'))
        transaction.onabort = () =>
          reject(transaction.error ?? new Error('indexedDB tx aborted'))
      }),
  )
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error ?? new Error('indexedDB req error'))
  })
}

// ---------------- favorites ----------------

export async function listFavorites(): Promise<Track[]> {
  try {
    return await tx(STORES.favorites, 'readonly', (s) =>
      req<Track[]>(s.getAll() as IDBRequest<Track[]>),
    )
  } catch {
    return []
  }
}

export async function addFavorite(track: Track): Promise<void> {
  try {
    await tx(STORES.favorites, 'readwrite', (s) => req(s.put(track)))
  } catch {
    /* ignore */
  }
}

export async function removeFavorite(id: string): Promise<void> {
  try {
    await tx(STORES.favorites, 'readwrite', (s) => req(s.delete(id)))
  } catch {
    /* ignore */
  }
}

export async function isFavorite(id: string): Promise<boolean> {
  try {
    const v = await tx(STORES.favorites, 'readonly', (s) =>
      req<Track | undefined>(s.get(id) as IDBRequest<Track | undefined>),
    )
    return !!v
  } catch {
    return false
  }
}

// ---------------- recently played ----------------

const RECENT_LIMIT = 50

export async function recordPlay(track: Track): Promise<void> {
  try {
    await tx(STORES.recentlyPlayed, 'readwrite', async (s) => {
      await req(s.put({ ...track, playedAt: Date.now() }))
      // Trim to RECENT_LIMIT oldest-first.
      const all = await req<RecentPlay[]>(s.getAll() as IDBRequest<RecentPlay[]>)
      if (all.length > RECENT_LIMIT) {
        const sorted = [...all].sort((a, b) => a.playedAt - b.playedAt)
        for (const entry of sorted.slice(0, all.length - RECENT_LIMIT)) {
          s.delete(entry.id)
        }
      }
    })

    // Bump the play-count store in a separate transaction.
    await tx(STORES.playCounts, 'readwrite', async (s) => {
      const existing = await req<PlayCount | undefined>(
        s.get(track.id) as IDBRequest<PlayCount | undefined>,
      )
      await req(
        s.put({
          id: track.id,
          track,
          count: (existing?.count ?? 0) + 1,
          lastPlayed: Date.now(),
        }),
      )
    })
  } catch {
    /* ignore */
  }
}

export async function getRecentlyPlayed(limit = 20): Promise<Track[]> {
  try {
    const all = await tx(STORES.recentlyPlayed, 'readonly', (s) =>
      req<RecentPlay[]>(s.getAll() as IDBRequest<RecentPlay[]>),
    )
    return [...all].sort((a, b) => b.playedAt - a.playedAt).slice(0, limit)
  } catch {
    return []
  }
}

export async function getTopPlayed(limit = 20): Promise<PlayCount[]> {
  try {
    const all = await tx(STORES.playCounts, 'readonly', (s) =>
      req<PlayCount[]>(s.getAll() as IDBRequest<PlayCount[]>),
    )
    return [...all].sort((a, b) => b.count - a.count).slice(0, limit)
  } catch {
    return []
  }
}

// ---------------- queue ----------------

export async function saveQueue(tracks: Track[]): Promise<void> {
  try {
    await tx(STORES.queue, 'readwrite', async (s) => {
      await req(s.clear())
      for (let i = 0; i < tracks.length; i++) {
        await req(s.put({ ...tracks[i], position: i }))
      }
    })
  } catch {
    /* ignore */
  }
}

export async function loadQueue(): Promise<Track[]> {
  try {
    const all = await tx(STORES.queue, 'readonly', (s) =>
      req<QueueEntry[]>(s.getAll() as IDBRequest<QueueEntry[]>),
    )
    return [...all].sort((a, b) => a.position - b.position)
  } catch {
    return []
  }
}

// ---------------- settings ----------------

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await tx(STORES.settings, 'readonly', (s) =>
      req<{ key: string; value: T } | undefined>(
        s.get(key) as IDBRequest<{ key: string; value: T } | undefined>,
      ),
    )
    return v?.value ?? fallback
  } catch {
    return fallback
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  try {
    await tx(STORES.settings, 'readwrite', (s) => req(s.put({ key, value })))
  } catch {
    /* ignore */
  }
}

export async function getPreferredQuality(): Promise<StreamQuality> {
  return getSetting<StreamQuality>('quality', 'LOSSLESS')
}

export async function setPreferredQuality(q: StreamQuality): Promise<void> {
  return setSetting('quality', q)
}
