import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/client'

type Mode = 'loading' | 'login' | 'setup'

export default function Login() {
  const { login, setup, checkConfigured } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('loading')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkConfigured()
      .then(configured => setMode(configured ? 'login' : 'setup'))
      .catch(() => setMode('login')) // default to login on error
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'setup') {
      if (password !== confirm) { setError('Passwords do not match'); return }
      if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    }

    setLoading(true)
    try {
      if (mode === 'setup') {
        await setup(username, password)
      } else {
        await login(username, password)
      }
      navigate('/collection', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.06) 0%, var(--bg) 60%)' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1
            className="font-display text-7xl tracking-widest"
            style={{ color: 'var(--text)', textShadow: '0 0 40px rgba(249,115,22,0.3)' }}
          >
            BACKLOGGED
          </h1>
          <p className="text-text-muted text-sm mt-1 tracking-widest uppercase">
            Your game vault
          </p>
        </div>

        {mode === 'loading' && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        )}

        {mode === 'setup' && (
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              First-time setup
            </p>
            <p className="text-xs text-text-muted mt-1">
              Create your login credentials
            </p>
          </div>
        )}

        {(mode === 'login' || mode === 'setup') && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className="input"
              type="text"
              placeholder="Username"
              autoComplete={mode === 'setup' ? 'username' : 'username'}
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {mode === 'setup' && (
              <input
                className="input"
                type="password"
                placeholder="Confirm password"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            )}

            {error && <p className="text-red text-sm text-center">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading
                ? mode === 'setup' ? 'Creating…' : 'Signing in…'
                : mode === 'setup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
