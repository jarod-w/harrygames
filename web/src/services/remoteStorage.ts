import type { HouseId, Player } from '../data/types'
import { StorageError, type HeadmasterLock, type LoginResult, type RegisterInput, type StorageService } from './contract'

const TOKEN = 'hogwarts_token_v1'
const TOKEN_PLAYER = 'hogwarts_token_player_v1'
const HEAD = 'hogwarts_head_token_v1'
const OUTBOX = 'hogwarts_outbox_v1'
const ROSTER = 'hogwarts_roster_v1'
const SELF = 'hogwarts_self_v1'

class ApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string) {
    super(code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

function authReason(code: string): LoginResult['reason'] | undefined {
  if (code === 'locked' || code === 'wrong' || code === 'missing' || code === 'pending') return code
  return undefined
}

async function request(path: string, init: RequestInit = {}, token?: string | null): Promise<unknown> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json')
  if (token) headers.set('authorization', `Bearer ${token}`)
  let res: Response
  try {
    res = await fetch(path, { ...init, headers })
  } catch {
    throw new ApiError(0, 'offline')
  }
  if (res.status === 204) return null
  const body = await res.json().catch(() => ({})) as { error?: string }
  if (!res.ok) throw new ApiError(res.status, body.error ?? 'bad')
  return body
}

/** Fields worth sending straight away. The curfew clock can wait. */
function stamp(p: Player): string {
  return JSON.stringify({
    house: p.house,
    avatar: p.avatar,
    wand: p.wand,
    wandChosen: p.wandChosen,
    cardSeen: p.cardSeen,
    storySeen: p.storySeen,
    grades: p.grades,
    level: p.level,
    housePoints: p.housePoints,
    galleons: p.galleons,
    stats: p.stats,
    bestStreak: p.bestStreak,
    currentStreak: p.currentStreak,
    pensieve: p.pensieve,
    inventory: p.inventory,
    unlockedAchievements: p.unlockedAchievements,
    customSettings: p.customSettings,
    difficulty: p.difficulty,
    restUntil: p.curfew.restUntil ?? 0,
    status: p.status,
  })
}

function readJson<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : undefined
  } catch {
    return undefined
  }
}

export class RemoteStorageService implements StorageService {
  private latest: Player | null = null
  private timer: ReturnType<typeof setTimeout> | null = null
  private lastStamp = ''
  private lastBody = ''
  private lastCurfewSent = 0

  constructor() {
    if (typeof window !== 'undefined') window.addEventListener('pagehide', () => { void this.flush() })
  }

  private token() { return sessionStorage.getItem(TOKEN) }
  private head() { return sessionStorage.getItem(HEAD) }

  private remember(player: Player) {
    localStorage.setItem(SELF, JSON.stringify(player))
    const outbox = readJson<Record<string, Player>>(OUTBOX) ?? {}
    if (outbox[player.playerId]) {
      delete outbox[player.playerId]
      localStorage.setItem(OUTBOX, JSON.stringify(outbox))
    }
  }

  private queue(player: Player) {
    const outbox = readJson<Record<string, Player>>(OUTBOX) ?? {}
    outbox[player.playerId] = player
    localStorage.setItem(OUTBOX, JSON.stringify(outbox))
    localStorage.setItem(SELF, JSON.stringify(player))
  }

  private queued(id: string): Player | undefined {
    return readJson<Record<string, Player>>(OUTBOX)?.[id]
  }

  private arm(ms: number) {
    if (this.timer != null) return
    this.timer = setTimeout(() => { void this.flush() }, ms)
  }

  /** Push the newest profile. Lesson fields go soon; the play clock goes every 20 seconds. */
  async flush() {
    if (this.timer != null) { clearTimeout(this.timer); this.timer = null }
    const player = this.latest
    const token = this.token()
    if (!player || !token || sessionStorage.getItem(TOKEN_PLAYER) !== player.playerId) return
    const body = JSON.stringify(player)
    if (body === this.lastBody) return
    try {
      const saved = await request('/api/me', { method: 'PUT', body, keepalive: true }, token) as Player
      this.lastBody = JSON.stringify(saved)
      this.lastStamp = stamp(saved)
      this.lastCurfewSent = Date.now()
      this.remember(saved)
      if (this.latest && JSON.stringify(this.latest) !== this.lastBody) this.arm(800)
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'offline' || err.status === 401)) this.queue(player)
    }
  }

  async listPlayers(): Promise<Player[]> {
    const head = this.head()
    try {
      const players = await request(head ? '/api/admin/players' : '/api/players', {}, head) as Player[]
      localStorage.setItem(ROSTER, JSON.stringify(players))
      return players
    } catch (err) {
      if (err instanceof ApiError && err.status === 401 && head) {
        sessionStorage.removeItem(HEAD)
        return this.listPlayers()
      }
      if (err instanceof ApiError && err.code === 'offline') return readJson<Player[]>(ROSTER) ?? []
      throw new StorageError('bad')
    }
  }

  async getPlayer(id: string) {
    if (this.token() && sessionStorage.getItem(TOKEN_PLAYER) === id) {
      await this.flush()
      const waiting = this.queued(id)
      if (waiting && !navigator.onLine) return waiting
      try {
        const player = await request('/api/me', {}, this.token()) as Player
        const still = this.queued(id)
        if (still) return still
        this.remember(player)
        this.lastBody = JSON.stringify(player)
        this.lastStamp = stamp(player)
        return player
      } catch (err) {
        if (err instanceof ApiError && err.code === 'offline') return waiting ?? readJson<Player>(SELF)
        if (err instanceof ApiError && err.status === 401) return undefined
        throw new StorageError('bad')
      }
    }
    return (await this.listPlayers()).find((p) => p.playerId === id)
  }

  savePlayer(player: Player) {
    if (sessionStorage.getItem(TOKEN_PLAYER) !== player.playerId) return Promise.resolve()
    this.latest = player
    localStorage.setItem(SELF, JSON.stringify(player))
    if (stamp(player) !== this.lastStamp) this.arm(400)
    else if (Date.now() - this.lastCurfewSent > 20_000) this.arm(400)
    return Promise.resolve()
  }

  async deletePlayer(id: string) {
    await request(`/api/admin/players/${id}`, { method: 'DELETE' }, this.head())
  }

  async houseCounts() {
    const counts: Record<HouseId, number> = { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 }
    for (const player of await this.listPlayers()) if (player.status === 'active' && player.house) counts[player.house]++
    return counts
  }

  async getHeadmaster(): Promise<HeadmasterLock | null> {
    const body = await request('/api/headmaster') as { configured: boolean }
    return body.configured ? { salt: '', hash: '' } : null
  }

  saveHeadmaster(_lock: HeadmasterLock): Promise<void> {
    return Promise.reject(new StorageError('bad'))
  }

  async register(input: RegisterInput) {
    try {
      const body = await request('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          nickname: input.nickname,
          avatar: input.avatar,
          english: input.english,
          math: input.math,
          runes: input.runes,
        }),
      }) as { token: string; player: Player }
      sessionStorage.setItem(TOKEN, body.token)
      sessionStorage.setItem(TOKEN_PLAYER, body.player.playerId)
      this.remember(body.player)
      this.latest = body.player
      this.lastBody = JSON.stringify(body.player)
      this.lastStamp = stamp(body.player)
      this.lastCurfewSent = Date.now()
      return body.player
    } catch (err) {
      if (err instanceof ApiError && err.code === 'taken') throw new StorageError('taken')
      if (err instanceof ApiError && err.code === 'offline') throw new StorageError('offline')
      throw new StorageError('bad')
    }
  }

  async login(playerId: string, runes: readonly string[], _now: number): Promise<LoginResult> {
    try {
      const body = await request('/api/login', { method: 'POST', body: JSON.stringify({ playerId, runes }) }) as { token: string; player: Player }
      sessionStorage.setItem(TOKEN, body.token)
      sessionStorage.setItem(TOKEN_PLAYER, body.player.playerId)
      const waiting = this.queued(playerId)
      if (waiting) {
        const saved = await request('/api/me', { method: 'PUT', body: JSON.stringify(waiting) }, body.token) as Player
        this.remember(saved)
        this.latest = saved
        this.lastBody = JSON.stringify(saved)
        this.lastStamp = stamp(saved)
        this.lastCurfewSent = Date.now()
        return { ok: true, player: saved }
      }
      this.remember(body.player)
      this.latest = body.player
      this.lastBody = JSON.stringify(body.player)
      this.lastStamp = stamp(body.player)
      this.lastCurfewSent = Date.now()
      return { ok: true, player: body.player }
    } catch (err) {
      if (err instanceof ApiError) {
        const reason = authReason(err.code)
        if (reason) return { ok: false, reason }
        if (err.code === 'offline') throw new StorageError('offline')
      }
      throw new StorageError('bad')
    }
  }

  async headmasterSet() {
    try {
      return (await this.getHeadmaster()) != null
    } catch (err) {
      if (err instanceof ApiError && err.code === 'offline') throw new StorageError('offline')
      throw new StorageError('bad')
    }
  }

  async setupHeadmaster(runes: readonly string[]) {
    try {
      const body = await request('/api/headmaster/setup', { method: 'POST', body: JSON.stringify({ runes }) }) as { token: string }
      sessionStorage.setItem(HEAD, body.token)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'offline') throw new StorageError('offline')
      throw new StorageError('bad')
    }
  }

  async unlockHeadmaster(runes: readonly string[], _now: number): Promise<{ ok: boolean; reason?: 'locked' | 'wrong' }> {
    try {
      const body = await request('/api/headmaster/login', { method: 'POST', body: JSON.stringify({ runes }) }) as { token: string }
      sessionStorage.setItem(HEAD, body.token)
      return { ok: true }
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'wrong' || err.code === 'locked')) {
        return { ok: false, reason: err.code === 'locked' ? 'locked' : 'wrong' }
      }
      if (err instanceof ApiError && err.code === 'offline') throw new StorageError('offline')
      throw new StorageError('bad')
    }
  }

  async approvePlayer(playerId: string) {
    return await request(`/api/admin/players/${playerId}/approve`, { method: 'POST' }, this.head()) as Player
  }

  async resetRunes(playerId: string, runes: readonly string[]) {
    return await request(`/api/admin/players/${playerId}/runes`, { method: 'POST', body: JSON.stringify({ runes }) }, this.head()) as Player
  }

  async endSession() {
    await this.flush()
    const token = this.token()
    this.latest = null
    sessionStorage.removeItem(TOKEN)
    sessionStorage.removeItem(TOKEN_PLAYER)
    if (token) void request('/api/logout', { method: 'POST' }, token).catch(() => undefined)
  }
}
