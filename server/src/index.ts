import { createServer, type IncomingMessage } from 'node:http'
import { backupDatabase } from './backup.ts'
import { createApp } from './app.ts'
import { openDb } from './db.ts'
import { validRunes } from './password.ts'

const port = Number(process.env.PORT ?? 8787)
const dbPath = process.env.DB_PATH ?? 'data/hogwarts.sqlite'
const headRunes = process.env.HEADMASTER_RUNES?.split(',').map((part) => part.trim())
const db = openDb(dbPath)
const app = createApp({ db, headRunes: headRunes && validRunes(headRunes) ? headRunes : undefined })

function headersOf(req: IncomingMessage): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue
    if (Array.isArray(value)) for (const item of value) headers.append(key, item)
    else headers.set(key, value)
  }
  return headers
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host ?? `127.0.0.1:${port}`
    const method = req.method ?? 'GET'
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    const raw = Buffer.concat(chunks)
    const hasBody = method !== 'GET' && method !== 'HEAD' && raw.length > 0
    const response = await app.fetch(new Request(new URL(req.url ?? '/', `http://${host}`), {
      method,
      headers: headersOf(req),
      body: hasBody ? raw : undefined,
    }))
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch (err) {
    console.error(err)
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: 'server' }))
  }
})

const day = 24 * 60 * 60 * 1000
try { backupDatabase(db, dbPath) } catch (err) { console.error('backup failed', err) }
setInterval(() => {
  try { backupDatabase(db, dbPath) } catch (err) { console.error('backup failed', err) }
}, day).unref()

server.listen(port, '0.0.0.0', () => {
  console.log(`hogwarts api listening on ${port}`)
})
