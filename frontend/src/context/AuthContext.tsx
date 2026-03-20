import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiFetch, setToken, clearToken, getToken } from '../api/client'
import type { AuthResponse, AuthStatusResponse } from '@backlogged/types'

interface AuthContextValue {
  token: string | null
  login: (username: string, password: string) => Promise<void>
  setup: (username: string, password: string) => Promise<void>
  checkConfigured: () => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
  }, [])

  // Auto-logout on 401 from any API call
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [logout])

  const login = async (username: string, password: string) => {
    const res = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    setToken(res.token)
    setTokenState(res.token)
  }

  const setup = async (username: string, password: string) => {
    const res = await apiFetch<AuthResponse>('/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    setToken(res.token)
    setTokenState(res.token)
  }

  const checkConfigured = () =>
    apiFetch<AuthStatusResponse>('/auth/status').then(r => r.configured)

  return (
    <AuthContext.Provider value={{ token, login, setup, checkConfigured, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
