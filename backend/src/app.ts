import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import authRouter from './routes/auth.js'
import gamesRouter from './routes/games.js'
import igdbRouter from './routes/igdb.js'
import hltbRouter from './routes/hltb.js'
import settingsRouter from './routes/settings.js'
import uploadsRouter from './routes/uploads.js'
import type { ApiError } from '@backlogged/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

app.use('/api/auth', authRouter)
app.use('/api/games', gamesRouter)
app.use('/api/igdb', igdbRouter)
app.use('/api/hltb', hltbRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/uploads', uploadsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, 'public')
  app.use(express.static(publicDir))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'))
  })
}

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  const body: ApiError = { error: 'internal_server_error', message: 'An unexpected error occurred' }
  res.status(500).json(body)
})

export default app
