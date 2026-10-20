import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { LocalStorageService } from './localStorage'

const mem = new Map<string, string>()
const localStorage = {
  getItem: (key: string) => mem.get(key) ?? null,
  setItem: (key: string, value: string) => { mem.set(key, value) },
  removeItem: (key: string) => { mem.delete(key) },
  clear: () => mem.clear(),
  key: (index: number) => [...mem.keys()][index] ?? null,
  get length() { return mem.size },
}
Object.assign(globalThis, { localStorage })

const RUNES = ['owl', 'wand', 'broom', 'bolt'] as const

describe('on-device castle', { concurrency: 1 }, () => {
  let storage: LocalStorageService
  beforeEach(() => {
    mem.clear()
    storage = new LocalStorageService()
  })

  it('logs in a sample wizard and locks the door after five misses', async () => {
    const players = await storage.listPlayers()
    const hermione = players.find((p) => p.nickname === 'Little Hermione')
    assert.ok(hermione)
    const ok = await storage.login(hermione.playerId, RUNES, 1_000)
    assert.equal(ok.ok, true)
    for (let i = 0; i < 4; i++) {
      const miss = await storage.login(hermione.playerId, ['book', 'book', 'book', 'book'], 2_000 + i)
      assert.equal(miss.reason, 'wrong')
    }
    const locked = await storage.login(hermione.playerId, ['book', 'book', 'book', 'book'], 3_000)
    assert.equal(locked.reason, 'locked')
    const still = await storage.login(hermione.playerId, RUNES, 3_100)
    assert.equal(still.reason, 'locked')
  })

  it('keeps a nickname for a wizard who is still waiting', async () => {
    await storage.register({ nickname: 'Newt', avatar: '🦔', english: 'starters', math: 1, runes: RUNES, now: 5_000 })
    await assert.rejects(() => storage.register({ nickname: 'newt', avatar: '🦉', english: 'movers', math: 3, runes: RUNES, now: 6_000 }), /taken/)
  })

  it('lets the headmaster approve and reset runes', async () => {
    assert.equal(await storage.headmasterSet(), false)
    await storage.setupHeadmaster(['moon', 'star', 'key', 'book'])
    const again = await storage.unlockHeadmaster(['book', 'book', 'book', 'book'], 1_000)
    assert.equal(again.ok, false)
    const open = await storage.unlockHeadmaster(['moon', 'star', 'key', 'book'], 1_000)
    assert.equal(open.ok, true)
    const created = await storage.register({ nickname: 'Newt', avatar: '🦔', english: 'flyers', math: 4, runes: RUNES, now: 7_000 })
    assert.equal(created.status, 'pending')
    const approved = await storage.approvePlayer(created.playerId)
    assert.equal(approved.status, 'active')
    await storage.resetRunes(created.playerId, ['star', 'star', 'star', 'moon'])
    const old = await storage.login(created.playerId, RUNES, 8_000)
    assert.equal(old.ok, false)
    const next = await storage.login(created.playerId, ['star', 'star', 'star', 'moon'], 8_000)
    assert.equal(next.ok, true)
  })
})
