import type { CurfewState } from '../data/types'

export const PLAY_LIMIT_MS = 20 * 60 * 1000
export const REST_MS = 10 * 60 * 1000

export function freshCurfew(now: number): CurfewState {
  return { playedMs: 0, lastSeenAt: now }
}

export function isResting(curfew: CurfewState, now: number): boolean {
  return curfew.restUntil != null && now < curfew.restUntil
}

export function curfewRemaining(curfew: CurfewState, now: number): { kind: 'play' | 'rest'; ms: number } {
  if (isResting(curfew, now)) return { kind: 'rest', ms: (curfew.restUntil ?? now) - now }
  return { kind: 'play', ms: Math.max(0, PLAY_LIMIT_MS - curfew.playedMs) }
}

export type CurfewTick = { state: CurfewState; resting: boolean; justOut: boolean }

/**
 * Time the castle was closed still counts, until the gap reaches a full rest.
 * A 10 minute absence is a rest, so the next visit starts a fresh 20 minutes.
 * `paused` is the lights-out screen: the clock does not start again until they come back in.
 */
export function tickCurfew(curfew: CurfewState, now: number, opts: { paused?: boolean } = {}): CurfewTick {
  if (curfew.restUntil != null && now < curfew.restUntil) {
    return { state: { ...curfew, lastSeenAt: now }, resting: true, justOut: false }
  }
  if (curfew.restUntil != null && now >= curfew.restUntil) {
    return { state: { playedMs: 0, lastSeenAt: now }, resting: false, justOut: false }
  }
  const gap = Math.max(0, now - curfew.lastSeenAt)
  if (gap >= REST_MS) {
    return { state: { playedMs: 0, lastSeenAt: now }, resting: false, justOut: false }
  }
  if (opts.paused) {
    return { state: { ...curfew, lastSeenAt: now }, resting: false, justOut: false }
  }
  const playedMs = curfew.playedMs + gap
  if (playedMs >= PLAY_LIMIT_MS) {
    return {
      state: { playedMs: 0, lastSeenAt: now, restUntil: now + REST_MS },
      resting: true,
      justOut: true,
    }
  }
  return { state: { playedMs, lastSeenAt: now }, resting: false, justOut: false }
}
