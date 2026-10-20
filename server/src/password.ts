import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export const MAX_TRIES = 5
export const LOCK_MS = 3 * 60 * 1000

const RUNE_IDS = ['owl', 'wand', 'broom', 'bolt', 'moon', 'star', 'key', 'potion', 'book']

export function newSalt(): string {
  return randomBytes(16).toString('hex')
}

/** Same string the browser hashes: salt, a colon, then the four rune ids. */
export function hashRunes(runes: readonly string[], salt: string): string {
  return createHash('sha256').update(`${salt}:${runes.join(',')}`).digest('hex')
}

export function matches(lock: { salt: string; hash: string }, runes: readonly string[]): boolean {
  const got = Buffer.from(hashRunes(runes, lock.salt))
  const want = Buffer.from(lock.hash)
  return got.length === want.length && timingSafeEqual(got, want)
}

export function validRunes(runes: unknown): runes is [string, string, string, string] {
  return Array.isArray(runes) && runes.length === 4 && runes.every((r) => typeof r === 'string' && RUNE_IDS.includes(r))
}

export function newToken(): string {
  return randomBytes(32).toString('base64url')
}

export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
