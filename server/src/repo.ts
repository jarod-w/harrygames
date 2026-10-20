import type { Sql } from './db.ts'
import { tokenHash } from './password.ts'
import { nicknameKey } from './profile.ts'
import type { Player } from './types.ts'

export type HeadRow = { salt: string; hash: string; failedLogins: number; lockedUntil?: number }
export type SessionRow = { kind: 'player' | 'headmaster'; playerId: string | null; expiresAt: number }

type PlayerRow = { document: string }
type HeadSql = { salt: string; hash: string; failed_logins: number; locked_until: number | null }
type SessionSql = { kind: string; player_id: string | null; expires_at: number }

function read(row: PlayerRow): Player {
  return JSON.parse(row.document) as Player
}

export function countPlayers(db: Sql): number {
  const row = db.prepare('SELECT COUNT(*) AS n FROM players').get() as { n: number }
  return row.n
}

export function insertPlayer(db: Sql, player: Player, now: number) {
  db.prepare(`INSERT INTO players (player_id, nickname, nickname_key, status, document, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)`).run(
    player.playerId,
    player.nickname,
    nicknameKey(player.nickname),
    player.status,
    JSON.stringify(player),
    now,
  )
}

export function savePlayer(db: Sql, player: Player, now: number) {
  db.prepare(`UPDATE players SET nickname = ?, nickname_key = ?, status = ?, document = ?, updated_at = ? WHERE player_id = ?`).run(
    player.nickname,
    nicknameKey(player.nickname),
    player.status,
    JSON.stringify(player),
    now,
    player.playerId,
  )
}

export function getPlayer(db: Sql, id: string): Player | undefined {
  const row = db.prepare('SELECT document FROM players WHERE player_id = ?').get(id) as PlayerRow | undefined
  return row ? read(row) : undefined
}

export function listPlayers(db: Sql): Player[] {
  const rows = db.prepare('SELECT document FROM players ORDER BY nickname COLLATE NOCASE').all() as PlayerRow[]
  return rows.map(read)
}

export function deletePlayer(db: Sql, id: string): boolean {
  const result = db.prepare('DELETE FROM players WHERE player_id = ?').run(id)
  return Number(result.changes) > 0
}

export function nicknameTaken(db: Sql, name: string): boolean {
  const row = db.prepare('SELECT 1 AS n FROM players WHERE nickname_key = ?').get(nicknameKey(name)) as { n: number } | undefined
  return row != null
}

export function getHead(db: Sql): HeadRow | undefined {
  const row = db.prepare('SELECT salt, hash, failed_logins, locked_until FROM headmaster WHERE id = 1').get() as HeadSql | undefined
  if (!row) return undefined
  return { salt: row.salt, hash: row.hash, failedLogins: row.failed_logins, lockedUntil: row.locked_until ?? undefined }
}

export function insertHead(db: Sql, salt: string, hash: string) {
  db.prepare('INSERT INTO headmaster (id, salt, hash, failed_logins, locked_until) VALUES (1, ?, ?, 0, NULL)').run(salt, hash)
}

export function saveHead(db: Sql, head: HeadRow) {
  db.prepare('UPDATE headmaster SET failed_logins = ?, locked_until = ? WHERE id = 1').run(head.failedLogins, head.lockedUntil ?? null)
}

export function createSession(db: Sql, token: string, kind: 'player' | 'headmaster', playerId: string | null, expiresAt: number) {
  db.prepare('INSERT INTO sessions (token_hash, kind, player_id, expires_at) VALUES (?, ?, ?, ?)').run(tokenHash(token), kind, playerId, expiresAt)
}

export function readSession(db: Sql, token: string, now: number): SessionRow | undefined {
  const row = db.prepare('SELECT kind, player_id, expires_at FROM sessions WHERE token_hash = ?').get(tokenHash(token)) as SessionSql | undefined
  if (!row) return undefined
  if (row.expires_at <= now) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(token))
    return undefined
  }
  return { kind: row.kind === 'headmaster' ? 'headmaster' : 'player', playerId: row.player_id, expiresAt: row.expires_at }
}

export function deleteSession(db: Sql, token: string) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(token))
}
