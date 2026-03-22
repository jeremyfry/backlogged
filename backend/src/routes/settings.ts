import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { readSettings, writeSettings } from '../services/settings.js'
import type { AppSettings } from '@backlogged/types'

const router = Router()
router.use(requireAuth)

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(readSettings())
  }),
)

router.patch(
  '/',
  asyncHandler(async (req, res) => {
    const current = readSettings()
    const patch = req.body as Partial<AppSettings>
    const updated: AppSettings = { ...current }

    if (Array.isArray(patch.igdbPlatforms)) {
      updated.igdbPlatforms = patch.igdbPlatforms.filter(p => typeof p === 'string')
    }

    if ('defaultCondition' in patch) {
      updated.defaultCondition = patch.defaultCondition ?? null
    }

    writeSettings(updated)
    res.json(updated)
  }),
)

export default router
