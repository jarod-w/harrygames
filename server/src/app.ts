import { Hono } from 'hono'
import type { Sql } from './db.ts'
import { LOCK_MS, MAX_TRIES, hashRunes, matches, newSalt, newToken, validRunes } from './password.ts'
import { AVATARS, createPlayer, mergeProfile, normalizeNickname, toClient } from './profile.ts'
import { countPlayers, createSession, deletePlayer, deleteSession, getHead, getPlayer, insertHead, insertPlayer, listPlayers, nicknameTaken, readSession, saveHead, savePlayer } from './repo.ts'
import { samplePlayers } from './seed.ts'
import type { EnglishLevel, MathGrade, Player } from './types.ts'

const PLAYER_TTL = 30 * 24 * 60 * 60 * 1000
const HEAD_TTL = 12 * 60 * 60 * 1000
const ENGLISH = new Set<EnglishLevel>(['starters', 'movers', 'flyers'])

export type AppOptions = {
  db: Sql
  seed?: boolean
  now?: () => number
  headRunes?: string[]
}

type SessionVars = { token: string; playerId: string }

function bearer(header: string | undefined): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(header ?? '')
  return match?.[1] ?? null
}

function noteFailure(failed: number, lockedUntil: number | undefined, now: number): { failedLogins: number; lockedUntil?: number; locked: boolean } {
  const fresh = lockedUntil != null && now >= lockedUntil
  const count = (fresh ? 0 : failed) + 1
  if (count >= MAX_TRIES) return { failedLogins: 0, lockedUntil: now + LOCK_MS, locked: true }
  return { failedLogins: count, locked: false }
}

export function createApp(opts: AppOptions) {
  const db = opts.db
  const now = opts.now ?? Date.now
  if (opts.seed !== false && countPlayers(db) === 0) {
    const at = now()
    for (const player of samplePlayers(at)) insertPlayer(db, player, at)
  }
  if (opts.headRunes && validRunes(opts.headRunes) && !getHead(db)) {
    const salt = newSalt()
    insertHead(db, salt, hashRunes(opts.headRunes, salt))
  }

  const app = new Hono()

  app.use('*', async (c, next) => {
    const len = Number(c.req.header('content-length') ?? 0)
    if (len > 200_000) return c.json({ error: 'too_large' }, 413)
    await next()
  })

  app.get('/api/health', (c) => c.json({ ok: true }))

  app.get('/api/players', (c) => {
    const players = listPlayers(db).filter((p) => p.status === 'active').map((p) => toClient(p, false))
    return c.json(players)
  })

  app.get('/api/players/:id', (c) => {
    const player = getPlayer(db, c.req.param('id'))
    if (!player || player.status !== 'active') return c.json({ error: 'missing' }, 404)
    const token = bearer(c.req.header('authorization'))
    const session = token ? readSession(db, token, now()) : undefined
    const full = session?.kind === 'player' && session.playerId === player.playerId
    return c.json(toClient(player, full))
  })

  app.post('/api/register', async (c) => {
    const body = await c.req.json().catch(() => null) as Record<string, unknown> | null
    if (!body) return c.json({ error: 'bad' }, 400)
    const nickname = typeof body.nickname === 'string' ? normalizeNickname(body.nickname) : ''
    const english = body.english
    const math = body.math
    if (!nickname || nickname.length > 16) return c.json({ error: 'bad' }, 400)
    if (typeof body.avatar !== 'string' || !AVATARS.includes(body.avatar)) return c.json({ error: 'bad' }, 400)
    if (typeof english !== 'string' || !ENGLISH.has(english as EnglishLevel)) return c.json({ error: 'bad' }, 400)
    if (typeof math !== 'number' || math < 1 || math > 6) return c.json({ error: 'bad' }, 400)
    if (!validRunes(body.runes)) return c.json({ error: 'bad' }, 400)
    if (nicknameTaken(db, nickname)) return c.json({ error: 'taken' }, 409)
    const at = now()
    const player = createPlayer({ nickname, avatar: body.avatar, english: english as EnglishLevel, math: math as MathGrade, runes: body.runes, now: at })
    try {
      insertPlayer(db, player, at)
    } catch {
      return c.json({ error: 'taken' }, 409)
    }
    const token = newToken()
    createSession(db, token, 'player', player.playerId, at + PLAYER_TTL)
    return c.json({ token, player: toClient(player, true) }, 201)
  })

  app.post('/api/login', async (c) => {
    const body = await c.req.json().catch(() => null) as { playerId?: unknown; runes?: unknown } | null
    if (!body || typeof body.playerId !== 'string' || !validRunes(body.runes)) return c.json({ error: 'bad' }, 400)
    const at = now()
    const player = getPlayer(db, body.playerId)
    if (!player) return c.json({ error: 'missing' }, 404)
    if (player.status !== 'active') return c.json({ error: 'pending' }, 403)
    if (player.lockedUntil && at < player.lockedUntil) {
      return c.json({ error: 'locked', lockedUntil: player.lockedUntil }, 401)
    }
    let current = player
    if (player.lockedUntil && at >= player.lockedUntil) {
      current = { ...player, lockedUntil: undefined, failedLogins: 0 }
    }
    if (!matches(current.password, body.runes)) {
      const next = noteFailure(current.failedLogins, current.lockedUntil, at)
      const updated: Player = { ...current, failedLogins: next.failedLogins, lockedUntil: next.lockedUntil }
      savePlayer(db, updated, at)
      return c.json(next.locked ? { error: 'locked', lockedUntil: next.lockedUntil } : { error: 'wrong' }, 401)
    }
    const updated: Player = { ...current, failedLogins: 0, lockedUntil: undefined }
    savePlayer(db, updated, at)
    const token = newToken()
    createSession(db, token, 'player', updated.playerId, at + PLAYER_TTL)
    return c.json({ token, player: toClient(updated, true) })
  })

  app.post('/api/logout', (c) => {
    const token = bearer(c.req.header('authorization'))
    if (token) deleteSession(db, token)
    return c.body(null, 204)
  })

  const me = new Hono<{ Variables: SessionVars }>()
  me.use('*', async (c, next) => {
    const token = bearer(c.req.header('authorization'))
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const session = readSession(db, token, now())
    if (!session || session.kind !== 'player' || !session.playerId) return c.json({ error: 'unauthorized' }, 401)
    c.set('token', token)
    c.set('playerId', session.playerId)
    await next()
  })

  me.get('/', (c) => {
    const player = getPlayer(db, c.get('playerId'))
    if (!player) return c.json({ error: 'missing' }, 404)
    return c.json(toClient(player, true))
  })

  me.put('/', async (c) => {
    const stored = getPlayer(db, c.get('playerId'))
    if (!stored) return c.json({ error: 'missing' }, 404)
    const body = await c.req.json().catch(() => null)
    const merged = mergeProfile(stored, body)
    savePlayer(db, merged, now())
    return c.json(toClient(merged, true))
  })

  app.route('/api/me', me)

  app.get('/api/headmaster', (c) => c.json({ configured: getHead(db) != null }))

  app.post('/api/headmaster/setup', async (c) => {
    if (getHead(db)) return c.json({ error: 'exists' }, 409)
    const body = await c.req.json().catch(() => null) as { runes?: unknown } | null
    if (!body || !validRunes(body.runes)) return c.json({ error: 'bad' }, 400)
    const salt = newSalt()
    try {
      insertHead(db, salt, hashRunes(body.runes, salt))
    } catch {
      return c.json({ error: 'exists' }, 409)
    }
    const at = now()
    const token = newToken()
    createSession(db, token, 'headmaster', null, at + HEAD_TTL)
    return c.json({ token }, 201)
  })

  app.post('/api/headmaster/login', async (c) => {
    const head = getHead(db)
    if (!head) return c.json({ error: 'missing' }, 404)
    const body = await c.req.json().catch(() => null) as { runes?: unknown } | null
    if (!body || !validRunes(body.runes)) return c.json({ error: 'bad' }, 400)
    const at = now()
    if (head.lockedUntil && at < head.lockedUntil) return c.json({ error: 'locked', lockedUntil: head.lockedUntil }, 401)
    const current = head.lockedUntil && at >= head.lockedUntil ? { ...head, failedLogins: 0, lockedUntil: undefined } : head
    if (!matches(current, body.runes)) {
      const next = noteFailure(current.failedLogins, current.lockedUntil, at)
      saveHead(db, { ...current, failedLogins: next.failedLogins, lockedUntil: next.lockedUntil })
      return c.json(next.locked ? { error: 'locked', lockedUntil: next.lockedUntil } : { error: 'wrong' }, 401)
    }
    saveHead(db, { ...current, failedLogins: 0, lockedUntil: undefined })
    const token = newToken()
    createSession(db, token, 'headmaster', null, at + HEAD_TTL)
    return c.json({ token })
  })

  const admin = new Hono()
  admin.use('*', async (c, next) => {
    const token = bearer(c.req.header('authorization'))
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const session = readSession(db, token, now())
    if (!session || session.kind !== 'headmaster') return c.json({ error: 'unauthorized' }, 401)
    await next()
  })

  admin.get('/players', (c) => c.json(listPlayers(db).map((p) => toClient(p, true))))

  admin.post('/players/:id/approve', (c) => {
    const player = getPlayer(db, c.req.param('id'))
    if (!player) return c.json({ error: 'missing' }, 404)
    const next = { ...player, status: 'active' as const }
    savePlayer(db, next, now())
    return c.json(toClient(next, true))
  })

  admin.delete('/players/:id', (c) => {
    const id = c.req.param('id')
    if (!deletePlayer(db, id)) return c.json({ error: 'missing' }, 404)
    return c.body(null, 204)
  })

  admin.post('/players/:id/runes', async (c) => {
    const player = getPlayer(db, c.req.param('id'))
    if (!player) return c.json({ error: 'missing' }, 404)
    const body = await c.req.json().catch(() => null) as { runes?: unknown } | null
    if (!body || !validRunes(body.runes)) return c.json({ error: 'bad' }, 400)
    const salt = newSalt()
    const next: Player = { ...player, password: { salt, hash: hashRunes(body.runes, salt) }, failedLogins: 0, lockedUntil: undefined }
    savePlayer(db, next, now())
    return c.json(toClient(next, true))
  })

  app.route('/api/admin', admin)

  return app
}
