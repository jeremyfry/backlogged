import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import express from 'express'
import authRouter from '../auth.js'

// Mock config so tests don't touch the filesystem
vi.mock('../../config.js', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}))

import { readConfig, writeConfig } from '../../config.js'
const mockReadConfig = vi.mocked(readConfig)
const mockWriteConfig = vi.mocked(writeConfig)

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/auth', authRouter)
  return app
}

const JWT_SECRET = 'test-secret-for-auth-tests'
const PASSWORD = 'hunter2hunter2'

describe('GET /api/auth/status', () => {
  it('returns configured: true when config exists', async () => {
    mockReadConfig.mockReturnValue({ username: 'admin', passwordHash: 'hash' })
    const res = await request(buildApp()).get('/api/auth/status')
    expect(res.status).toBe(200)
    expect(res.body.configured).toBe(true)
  })

  it('returns configured: false when no config', async () => {
    mockReadConfig.mockReturnValue(null)
    const res = await request(buildApp()).get('/api/auth/status')
    expect(res.status).toBe(200)
    expect(res.body.configured).toBe(false)
  })
})

describe('POST /api/auth/setup', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET
    vi.clearAllMocks()
    mockReadConfig.mockReturnValue(null) // unconfigured by default
  })

  it('creates credentials and returns a token', async () => {
    const res = await request(buildApp())
      .post('/api/auth/setup')
      .send({ username: 'admin', password: 'securepass123' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(mockWriteConfig).toHaveBeenCalledOnce()
  })

  it('returns 409 when already configured', async () => {
    mockReadConfig.mockReturnValue({ username: 'admin', passwordHash: 'hash' })
    const res = await request(buildApp())
      .post('/api/auth/setup')
      .send({ username: 'admin', password: 'securepass123' })
    expect(res.status).toBe(409)
  })

  it('returns 400 when password is too short', async () => {
    const res = await request(buildApp())
      .post('/api/auth/setup')
      .send({ username: 'admin', password: 'short' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when fields are missing', async () => {
    const res = await request(buildApp())
      .post('/api/auth/setup')
      .send({ username: 'admin' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET
    vi.clearAllMocks()
  })

  it('returns a token for valid credentials', async () => {
    const passwordHash = await bcrypt.hash(PASSWORD, 10)
    mockReadConfig.mockReturnValue({ username: 'admin', passwordHash })

    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ username: 'admin', password: PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(typeof res.body.token).toBe('string')
  })

  it('returns 401 for wrong password', async () => {
    const passwordHash = await bcrypt.hash(PASSWORD, 10)
    mockReadConfig.mockReturnValue({ username: 'admin', passwordHash })

    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('unauthorized')
  })

  it('returns 401 for wrong username', async () => {
    const passwordHash = await bcrypt.hash(PASSWORD, 10)
    mockReadConfig.mockReturnValue({ username: 'admin', passwordHash })

    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ username: 'notadmin', password: PASSWORD })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('unauthorized')
  })

  it('returns 400 when body fields are missing', async () => {
    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ username: 'admin' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('bad_request')
  })

  it('returns 500 when config file does not exist', async () => {
    mockReadConfig.mockReturnValue(null)

    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ username: 'admin', password: PASSWORD })

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('server_error')
  })
})
