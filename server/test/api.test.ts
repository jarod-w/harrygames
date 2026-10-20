import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, describe, it } from 'node:test'
import { createApp } from '../src/app.ts'
import { backupDatabase } from '../src/backup.ts'
import { openDb } from '../src/db.ts'
import { LOCK_MS } from '../src/password.ts'
import { getPlayer } from '../src/repo.ts'
import type { Player } from '../src/types.ts'

const RUNES = ['owl', 'wand', 'broom', 'bolt']

function boot(headRunes?: string[]) {
  let clock = 1_700_000_000_000
  const db = openDb(':memory:')
  const app = createApp({ db, now: () => clock, headRunes })
  return {
    db,
    app,
    at: (next: number) => { clock = next },
    now: () => clock,
  }
}

async function send(app: ReturnType<typeof createApp>, path: string, init: RequestInit = {}) {
  const res = await app.request(path, init)
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) as Record<string, unknown> : null }
}

function post(body: unknown, token?: string): RequestInit {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  return { method: 'POST', headers, body: JSON.stringify(body) }
}

describe('castle api', () => {
  it('answers a health check', async () => {
    const world = boot()
    const res = await send(world.app, '/api/health')
    assert.equal(res.status, 200)
    assert.deepEqual(res.body, { ok: true })
  })

  it('lists approved wizards without password hashes', async () => {
    const world = boot()
    const res = await send(world.app, '/api/players')
    assert.equal(res.status, 200)
    const players = res.body as unknown as Player[]
    assert.equal(players.some((p) => p.nickname === 'Little Hermione'), true)
    assert.equal(players.some((p) => p.nickname === 'Tiny Toad'), false)
    assert.equal(players.every((p) => p.password.hash === '' && p.pensieve.length === 0), true)
  })

  it('logs in with the sample runes and keeps the hash on the server', async () => {
    const world = boot()
    const res = await send(world.app, '/api/login', post( { playerId: 'wiz_001', runes: RUNES }))
    assert.equal(res.status, 200)
    const player = res.body?.player as Player
    assert.equal(player.nickname, 'Little Hermione')
    assert.equal(player.password.hash, '')
    const stored = getPlayer(world.db, 'wiz_001')
    assert.equal(stored?.password.hash.length, 64)
    const me = await send(world.app, '/api/me', { headers: { authorization: `Bearer ${res.body?.token as string}` } })
    assert.equal(me.status, 200)
    assert.equal((me.body as unknown as Player).playerId, 'wiz_001')
  })

  it('locks the door after five wrong rune sequences', async () => {
    const fresh = boot()
    for (let i = 0; i < 4; i++) {
      const res = await send(fresh.app, '/api/login', post( { playerId: 'wiz_002', runes: ['book', 'book', 'book', 'book'] }))
      assert.equal(res.status, 401)
      assert.equal(res.body?.error, 'wrong')
    }
    const locked = await send(fresh.app, '/api/login', post( { playerId: 'wiz_002', runes: ['book', 'book', 'book', 'book'] }))
    assert.equal(locked.body?.error, 'locked')
    const again = await send(fresh.app, '/api/login', post( { playerId: 'wiz_002', runes: RUNES }))
    assert.equal(again.body?.error, 'locked')
    fresh.at(fresh.now() + LOCK_MS)
    const open = await send(fresh.app, '/api/login', post( { playerId: 'wiz_002', runes: RUNES }))
    assert.equal(open.status, 200)
  })

  it('refuses a duplicate nickname, including a different case', async () => {
    const world = boot()
    const res = await send(world.app, '/api/register', post( {
      nickname: '  little   hermione ', avatar: '🦔', english: 'starters', math: 2, runes: RUNES,
    }))
    assert.equal(res.status, 409)
    assert.equal(res.body?.error, 'taken')
  })

  it('holds a new wizard until the headmaster approves', async () => {
    const world = boot()
    const created = await send(world.app, '/api/register', post( {
      nickname: 'Newt', avatar: '🦔', english: 'flyers', math: 6, runes: ['moon', 'star', 'key', 'book'],
    }))
    assert.equal(created.status, 201)
    const player = created.body?.player as Player
    assert.equal(player.status, 'pending')
    const listed = await send(world.app, '/api/players')
    assert.equal((listed.body as unknown as Player[]).some((p) => p.playerId === player.playerId), false)
    const blocked = await send(world.app, '/api/login', post( { playerId: player.playerId, runes: ['moon', 'star', 'key', 'book'] }))
    assert.equal(blocked.status, 403)

    const denied = await send(world.app, `/api/admin/players/${player.playerId}/approve`, { method: 'POST' })
    assert.equal(denied.status, 401)

    const office = await send(world.app, '/api/headmaster/setup', post( { runes: ['key', 'key', 'moon', 'book'] }))
    assert.equal(office.status, 201)
    const head = office.body?.token as string
    const approved = await send(world.app, `/api/admin/players/${player.playerId}/approve`, {
      method: 'POST',
      headers: { authorization: `Bearer ${head}` },
    })
    assert.equal(approved.status, 200)
    const login = await send(world.app, '/api/login', post( { playerId: player.playerId, runes: ['moon', 'star', 'key', 'book'] }))
    assert.equal(login.status, 200)
  })

  it('saves lesson progress and ignores a forged approval or password', async () => {
    const world = boot()
    const login = await send(world.app, '/api/login', post( { playerId: 'wiz_001', runes: RUNES }))
    const token = login.body?.token as string
    const player = login.body?.player as Player
    const forged = {
      ...player,
      status: 'pending',
      nickname: 'Someone Else',
      housePoints: 999,
      password: { salt: 'nope', hash: 'nope' },
      wand: { core: 'dragon', skin: 'skin_gold' },
    }
    const saved = await send(world.app, '/api/me', {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(forged),
    })
    const body = saved.body as unknown as Player
    assert.equal(body.status, 'active')
    assert.equal(body.nickname, 'Little Hermione')
    assert.equal(body.housePoints, 999)
    assert.equal(body.wand.core, 'phoenix')
    assert.equal(body.password.hash, '')
    const stored = getPlayer(world.db, 'wiz_001')
    assert.notEqual(stored?.password.hash, 'nope')
    const still = await send(world.app, '/api/login', post( { playerId: 'wiz_001', runes: RUNES }))
    assert.equal(still.status, 200)
  })

  it('lets the headmaster reset runes and send a letter back', async () => {
    const world = boot()
    const office = await send(world.app, '/api/headmaster/setup', post( { runes: ['key', 'key', 'moon', 'book'] }))
    const head = office.body?.token as string
    const reset = await send(world.app, '/api/admin/players/wiz_005/runes', post( { runes: ['star', 'star', 'star', 'moon'] }, head))
    assert.equal(reset.status, 200)
    const old = await send(world.app, '/api/login', post( { playerId: 'wiz_005', runes: RUNES }))
    assert.equal(old.status, 401)
    const next = await send(world.app, '/api/login', post( { playerId: 'wiz_005', runes: ['star', 'star', 'star', 'moon'] }))
    assert.equal(next.status, 200)
    const gone = await send(world.app, '/api/admin/players/wiz_006', { method: 'DELETE', headers: { authorization: `Bearer ${head}` } })
    assert.equal(gone.status, 204)
    const missing = await send(world.app, '/api/login', post( { playerId: 'wiz_006', runes: RUNES }))
    assert.equal(missing.status, 404)
  })

  it('locks the headmaster office after five wrong tries', async () => {
    const fresh = boot(['owl', 'owl', 'owl', 'owl'])
    for (let i = 0; i < 5; i++) {
      await send(fresh.app, '/api/headmaster/login', post( { runes: ['book', 'book', 'book', 'book'] }))
    }
    const locked = await send(fresh.app, '/api/headmaster/login', post( { runes: ['owl', 'owl', 'owl', 'owl'] }))
    assert.equal(locked.body?.error, 'locked')
  })
})

describe('backup', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hogwarts-'))
  const path = join(dir, 'hogwarts.sqlite')
  after(() => rmSync(dir, { recursive: true, force: true }))

  it('keeps a daily copy beside the database', () => {
    const db = openDb(path)
    db.exec('CREATE TABLE IF NOT EXISTS note (id INTEGER)')
    backupDatabase(db, path, new Date('2026-10-20T00:00:00Z'))
    backupDatabase(db, path, new Date('2026-10-21T00:00:00Z'))
    const names = readdirSync(join(dir, 'backups')).sort()
    assert.deepEqual(names, ['hogwarts-2026-10-20.sqlite', 'hogwarts-2026-10-21.sqlite'])
    db.close()
  })
})
