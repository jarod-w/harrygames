import type { PasswordLock, Player } from '../data/types'

export const MAX_TRIES = 5
export const LOCK_MS = 3 * 60 * 1000

function hex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function newSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return hex(bytes)
}

export async function hashRunes(runes: readonly string[], salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${runes.join(',')}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return hex(new Uint8Array(digest))
}

export async function matchesLock(lock: PasswordLock, runes: readonly string[]): Promise<boolean> {
  return (await hashRunes(runes, lock.salt)) === lock.hash
}

export async function lockRunes(runes: readonly string[]): Promise<PasswordLock> {
  const salt = newSalt()
  return { salt, hash: await hashRunes(runes, salt) }
}

export async function withRunes(player: Player, runes: readonly string[]): Promise<Player> {
  return { ...player, password: await lockRunes(runes), failedLogins: 0, lockedUntil: undefined }
}

export async function checkRunes(
  player: Player,
  runes: readonly string[],
  now: number,
): Promise<{ ok: boolean; player: Player; reason?: 'locked' | 'wrong' }> {
  if (player.lockedUntil && now < player.lockedUntil) {
    return { ok: false, player, reason: 'locked' }
  }
  let next = player
  if (player.lockedUntil && now >= player.lockedUntil) {
    next = { ...player, lockedUntil: undefined, failedLogins: 0 }
  }
  const hash = await hashRunes(runes, next.password.salt)
  if (hash === next.password.hash) {
    return { ok: true, player: { ...next, failedLogins: 0, lockedUntil: undefined } }
  }
  const failedLogins = next.failedLogins + 1
  const locked = failedLogins >= MAX_TRIES
  return {
    ok: false,
    reason: locked ? 'locked' : 'wrong',
    player: {
      ...next,
      failedLogins: locked ? 0 : failedLogins,
      lockedUntil: locked ? now + LOCK_MS : undefined,
    },
  }
}
