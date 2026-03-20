import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import * as gamesService from '../services/games.js'
import type { CreateGameInput, UpdateGameInput, ApiError } from '@backlogged/types'

const router = Router()
router.use(requireAuth)

// Reorder must come before /:id to avoid being swallowed by the param route
router.patch(
  '/backlog/reorder',
  asyncHandler(async (req, res) => {
    const { ids } = req.body as { ids?: unknown }
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'number')) {
      const body: ApiError = { error: 'bad_request', message: 'ids must be an array of numbers' }
      res.status(400).json(body)
      return
    }
    gamesService.reorderBacklog(ids)
    res.status(204).send()
  }),
)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, ownershipStatus, platform, language, completionStatus, sort, order } =
      req.query as Record<string, string | undefined>
    const result = await gamesService.listGames({
      search,
      ownershipStatus,
      platform,
      language,
      completionStatus,
      sort,
      order: order === 'desc' ? 'desc' : 'asc',
    })
    res.json(result)
  }),
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = req.body as Partial<CreateGameInput>
    if (!input.title || !input.platform || !input.language || !input.ownershipStatus) {
      const body: ApiError = {
        error: 'bad_request',
        message: 'title, platform, language, and ownershipStatus are required',
      }
      res.status(400).json(body)
      return
    }
    const game = await gamesService.createGame(input as CreateGameInput)
    res.status(201).json(game)
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      const body: ApiError = { error: 'bad_request', message: 'Invalid game id' }
      res.status(400).json(body)
      return
    }
    const game = await gamesService.getGame(id)
    if (!game) {
      const body: ApiError = { error: 'not_found', message: 'Game not found' }
      res.status(404).json(body)
      return
    }
    res.json(game)
  }),
)

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      const body: ApiError = { error: 'bad_request', message: 'Invalid game id' }
      res.status(400).json(body)
      return
    }
    const game = await gamesService.updateGame(id, req.body as UpdateGameInput)
    if (!game) {
      const body: ApiError = { error: 'not_found', message: 'Game not found' }
      res.status(404).json(body)
      return
    }
    res.json(game)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      const body: ApiError = { error: 'bad_request', message: 'Invalid game id' }
      res.status(400).json(body)
      return
    }
    const game = await gamesService.deleteGame(id)
    if (!game) {
      const body: ApiError = { error: 'not_found', message: 'Game not found' }
      res.status(404).json(body)
      return
    }
    res.status(204).send()
  }),
)

export default router
