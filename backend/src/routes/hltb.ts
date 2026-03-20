import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { searchHltb } from '../services/hltb.js'
import type { ApiError } from '@backlogged/types'

const router = Router()
router.use(requireAuth)

// GET /api/hltb/search?q=castlevania
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = req.query.q as string | undefined
    if (!q?.trim()) {
      const body: ApiError = { error: 'bad_request', message: 'q parameter is required' }
      res.status(400).json(body)
      return
    }
    const results = await searchHltb(q.trim())
    res.json(results)
  }),
)

export default router
