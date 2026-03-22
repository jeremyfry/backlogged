import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { searchGames, getIgdbGame } from '../services/igdb.js'
import type { ApiError } from '@backlogged/types'

const router = Router()
router.use(requireAuth)

// GET /api/igdb/search?q=castlevania
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { q, beforeYear } = req.query as Record<string, string | undefined>
    if (!q?.trim()) {
      const body: ApiError = { error: 'bad_request', message: 'q parameter is required' }
      res.status(400).json(body)
      return
    }
    const beforeYearNum = beforeYear ? parseInt(beforeYear, 10) : undefined
    const results = await searchGames(q.trim(), {
      beforeYear: Number.isFinite(beforeYearNum) ? beforeYearNum : undefined,
    })
    res.json(results)
  }),
)

// GET /api/igdb/games/:id
router.get(
  '/games/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      const body: ApiError = { error: 'bad_request', message: 'Invalid IGDB id' }
      res.status(400).json(body)
      return
    }
    const game = await getIgdbGame(id)
    if (!game) {
      const body: ApiError = { error: 'not_found', message: 'Game not found on IGDB' }
      res.status(404).json(body)
      return
    }
    res.json(game)
  }),
)

export default router
