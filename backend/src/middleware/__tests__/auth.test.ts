import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'
import { requireAuth } from '../auth.js'

const JWT_SECRET = 'test-secret-for-middleware-tests'

function buildApp() {
  const app = express()
  app.get('/protected', requireAuth, (_req, res) => {
    res.json({ ok: true })
  })
  return app
}

describe('requireAuth middleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET
  })

  it('passes through with a valid token', async () => {
    const token = jwt.sign({ username: 'admin' }, JWT_SECRET, { expiresIn: '1h' })

    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('returns 401 with no Authorization header', async () => {
    const res = await request(buildApp()).get('/protected')

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('unauthorized')
  })

  it('returns 401 with a malformed token', async () => {
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer notavalidtoken')

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('unauthorized')
  })

  it('returns 401 with an expired token', async () => {
    const token = jwt.sign({ username: 'admin' }, JWT_SECRET, { expiresIn: '-1s' })

    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('unauthorized')
  })

  it('returns 401 with a token signed by the wrong secret', async () => {
    const token = jwt.sign({ username: 'admin' }, 'wrong-secret')

    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('unauthorized')
  })
})
