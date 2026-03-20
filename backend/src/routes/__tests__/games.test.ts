import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'
import gamesRouter from '../games.js'
import type { ApiError } from '@backlogged/types'
import type { GameRow } from '../../db/schema.js'

vi.mock('../../services/games.js', () => ({
  listGames: vi.fn(),
  getGame: vi.fn(),
  createGame: vi.fn(),
  updateGame: vi.fn(),
  deleteGame: vi.fn(),
  reorderBacklog: vi.fn(),
}))

import * as gamesService from '../../services/games.js'

const JWT_SECRET = 'test-secret'
const token = jwt.sign({ username: 'admin' }, JWT_SECRET)

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/games', gamesRouter)
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const body: ApiError = { error: 'internal_server_error', message: String(err) }
    res.status(500).json(body)
  })
  return app
}

const auth = { Authorization: `Bearer ${token}` }

const mockGame: GameRow = {
  id: 1,
  title: 'Castlevania',
  platform: 'NES',
  language: 'English',
  ownershipStatus: 'owned',
  completionStatus: 'unplayed',
  condition: 'complete_in_box',
  genre: null,
  developer: null,
  publisher: null,
  releaseYear: 1986,
  coverArtUrl: null,
  igdbId: null,
  personalRating: null,
  hltbMainStory: null,
  hltbExtras: null,
  hltbCompletionist: null,
  notes: null,
  purchasePrice: null,
  purchaseDate: null,
  purchaseLocation: null,
  targetPrice: null,
  backlogPosition: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('GET /api/games', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET
    vi.mocked(gamesService.listGames).mockResolvedValue([mockGame])
  })

  it('returns list of games', async () => {
    const res = await request(buildApp()).get('/api/games').set(auth)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].title).toBe('Castlevania')
  })

  it('returns 401 without token', async () => {
    const res = await request(buildApp()).get('/api/games')
    expect(res.status).toBe(401)
  })

  it('passes query filters to service', async () => {
    await request(buildApp())
      .get('/api/games?platform=NES&language=Japanese&search=Akumajo')
      .set(auth)
    expect(gamesService.listGames).toHaveBeenCalledWith(
      expect.objectContaining({ platform: 'NES', language: 'Japanese', search: 'Akumajo' }),
    )
  })
})

describe('POST /api/games', () => {
  beforeEach(() => {
    vi.mocked(gamesService.createGame).mockResolvedValue(mockGame)
  })

  it('creates a game and returns 201', async () => {
    const res = await request(buildApp())
      .post('/api/games')
      .set(auth)
      .send({ title: 'Castlevania', platform: 'NES', language: 'English', ownershipStatus: 'owned' })
    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Castlevania')
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await request(buildApp())
      .post('/api/games')
      .set(auth)
      .send({ title: 'Castlevania' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('bad_request')
  })
})

describe('GET /api/games/:id', () => {
  it('returns the game', async () => {
    vi.mocked(gamesService.getGame).mockResolvedValue(mockGame)
    const res = await request(buildApp()).get('/api/games/1').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(1)
  })

  it('returns 404 when game does not exist', async () => {
    vi.mocked(gamesService.getGame).mockResolvedValue(null as never)
    const res = await request(buildApp()).get('/api/games/999').set(auth)
    expect(res.status).toBe(404)
  })

  it('returns 400 for a non-numeric id', async () => {
    const res = await request(buildApp()).get('/api/games/abc').set(auth)
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/games/:id', () => {
  it('updates and returns the game', async () => {
    const updated = { ...mockGame, completionStatus: 'completed' }
    vi.mocked(gamesService.updateGame).mockResolvedValue(updated as typeof mockGame)
    const res = await request(buildApp())
      .patch('/api/games/1')
      .set(auth)
      .send({ completionStatus: 'completed' })
    expect(res.status).toBe(200)
    expect(res.body.completionStatus).toBe('completed')
  })

  it('returns 404 when game does not exist', async () => {
    vi.mocked(gamesService.updateGame).mockResolvedValue(null as never)
    const res = await request(buildApp()).patch('/api/games/999').set(auth).send({ notes: 'hi' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/games/:id', () => {
  it('deletes the game and returns 204', async () => {
    vi.mocked(gamesService.deleteGame).mockResolvedValue(mockGame)
    const res = await request(buildApp()).delete('/api/games/1').set(auth)
    expect(res.status).toBe(204)
  })

  it('returns 404 when game does not exist', async () => {
    vi.mocked(gamesService.deleteGame).mockResolvedValue(null as never)
    const res = await request(buildApp()).delete('/api/games/999').set(auth)
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/games/backlog/reorder', () => {
  it('reorders and returns 204', async () => {
    vi.mocked(gamesService.reorderBacklog).mockResolvedValue(undefined)
    const res = await request(buildApp())
      .patch('/api/games/backlog/reorder')
      .set(auth)
      .send({ ids: [3, 1, 2] })
    expect(res.status).toBe(204)
    expect(gamesService.reorderBacklog).toHaveBeenCalledWith([3, 1, 2])
  })

  it('returns 400 when ids is not an array', async () => {
    const res = await request(buildApp())
      .patch('/api/games/backlog/reorder')
      .set(auth)
      .send({ ids: 'notanarray' })
    expect(res.status).toBe(400)
  })
})
