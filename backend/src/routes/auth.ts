import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { readConfig, writeConfig } from '../config.js'
import type { AuthResponse, AuthStatusResponse, ApiError } from '@backlogged/types'

const router = Router()

// GET /api/auth/status — public, no token required
router.get('/status', (_req, res) => {
  const body: AuthStatusResponse = { configured: readConfig() !== null }
  res.json(body)
})

// POST /api/auth/setup — only works when unconfigured
router.post('/setup', async (req, res) => {
  if (readConfig() !== null) {
    const body: ApiError = { error: 'conflict', message: 'Already configured' }
    res.status(409).json(body)
    return
  }

  const { username, password } = req.body as { username?: string; password?: string }

  if (!username || !password) {
    const body: ApiError = { error: 'bad_request', message: 'Username and password required' }
    res.status(400).json(body)
    return
  }

  if (password.length < 8) {
    const body: ApiError = { error: 'bad_request', message: 'Password must be at least 8 characters' }
    res.status(400).json(body)
    return
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    const body: ApiError = { error: 'server_error', message: 'JWT_SECRET not set' }
    res.status(500).json(body)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  writeConfig({ username, passwordHash })
  console.log(`First-time setup complete — created login for "${username}"`)

  const token = jwt.sign({ username }, secret, { expiresIn: '30d' })
  const body: AuthResponse = { token }
  res.status(201).json(body)
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string }

  if (!username || !password) {
    const body: ApiError = { error: 'bad_request', message: 'Username and password required' }
    res.status(400).json(body)
    return
  }

  const config = readConfig()
  if (!config) {
    const body: ApiError = { error: 'server_error', message: 'Not configured — complete setup first' }
    res.status(500).json(body)
    return
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    const body: ApiError = { error: 'server_error', message: 'JWT_SECRET not set' }
    res.status(500).json(body)
    return
  }

  // Constant-time comparison to avoid username enumeration
  const usernameMatch = username === config.username
  const passwordMatch = await bcrypt.compare(password, config.passwordHash)

  if (!usernameMatch || !passwordMatch) {
    const body: ApiError = { error: 'unauthorized', message: 'Invalid credentials' }
    res.status(401).json(body)
    return
  }

  const token = jwt.sign({ username }, secret, { expiresIn: '30d' })
  const body: AuthResponse = { token }
  res.json(body)
})

export default router
