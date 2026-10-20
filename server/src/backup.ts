import { copyFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Sql } from './db.ts'

const KEEP = 14

/** Copy the database file once per calendar day and keep two weeks of copies. */
export function backupDatabase(db: Sql, dbPath: string, now = new Date()) {
  if (!dbPath || dbPath === ':memory:') return
  db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
  const folder = join(dirname(dbPath), 'backups')
  mkdirSync(folder, { recursive: true })
  const day = now.toISOString().slice(0, 10)
  copyFileSync(dbPath, join(folder, `hogwarts-${day}.sqlite`))
  const files = readdirSync(folder).filter((name) => name.startsWith('hogwarts-') && name.endsWith('.sqlite')).sort()
  for (const old of files.slice(0, Math.max(0, files.length - KEEP))) unlinkSync(join(folder, old))
}
