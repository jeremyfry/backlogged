import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { ApiError } from '@backlogged/types'

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    const body: ApiError = { error: 'unauthorized', message: 'Missing token' }
    res.status(401).json(body)
    return
  }

  const token = authHeader.slice(7)
  const secret = process.env.JWT_SECRET
  if (!secret) {
    const body: ApiError = { error: 'server_error', message: 'JWT secret not configured' }
    res.status(500).json(body)
    return
  }

  try {
    jwt.verify(token, secret)
    next()
  } catch {
    const body: ApiError = { error: 'unauthorized', message: 'Invalid or expired token' }
    res.status(401).json(body)
  }
}
