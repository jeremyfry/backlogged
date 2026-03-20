import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Library, Heart, ListOrdered, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import SiteLogo from './SiteLogo'

const NAV = [
  { to: '/collection', icon: Library,    label: 'Collection' },
  { to: '/wishlist',   icon: Heart,       label: 'Wishlist' },
  { to: '/backlog',    icon: ListOrdered, label: 'Up Next' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 pt-safe"
        style={{
          background: 'var(--surface-glass)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          height: '56px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center h-full px-4 max-w-4xl mx-auto" style={{ position: 'relative' }}>
        {/* Hamburger — left */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="p-2 text-text-muted hover:text-text transition-colors"
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          {open && (
            <div
              className="absolute left-0 top-full mt-1 w-48 rounded-xl overflow-hidden shadow-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {NAV.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-accent'
                        : 'text-text-muted hover:text-text hover:bg-elevated'
                    }`
                  }
                  style={({ isActive }) => isActive ? { background: 'var(--elevated)' } : {}}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}

              <div style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => { setOpen(false); handleLogout() }}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium w-full text-left text-text-muted hover:text-text hover:bg-elevated transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logo — centered absolutely so it's independent of the menu width */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
          <SiteLogo />
        </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto px-3 py-3 flex flex-col">
        <div className="relative flex-1 max-w-4xl w-full mx-auto rounded-xl"
             style={{ border: '1px solid var(--border)' }}>
          {/* Blur layer as a child so it doesn't create a containing block for fixed elements */}
          <div className="absolute inset-0 rounded-xl pointer-events-none"
               style={{
                 background: 'var(--surface-glass)',
                 backdropFilter: 'blur(12px)',
                 WebkitBackdropFilter: 'blur(12px)',
               }} />
          <div className="relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
