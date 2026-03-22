import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  required?: boolean
}

export default function Combobox({ value, onChange, options, placeholder, required }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = search.trim()
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = () => {
    setSearch('')
    setOpen(true)
    // Select all text so user can immediately type to filter
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleSelect = (option: string) => {
    onChange(option)
    setOpen(false)
    setSearch('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setSearch('') }
    if (e.key === 'Enter' && filtered.length === 1) { handleSelect(filtered[0]); e.preventDefault() }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          className="input pr-8"
          value={open ? search : value}
          onChange={e => setSearch(e.target.value)}
          onFocus={handleOpen}
          onKeyDown={handleKeyDown}
          placeholder={open ? 'Type to filter…' : placeholder}
          required={required && !value}
          readOnly={!open}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => open ? (setOpen(false), setSearch('')) : handleOpen()}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
        >
          <ChevronDown
            size={16}
            className="transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
      </div>

      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-text-muted">No matches</p>
          ) : (
            filtered.map(option => (
              <button
                key={option}
                type="button"
                onMouseDown={e => { e.preventDefault(); handleSelect(option) }}
                className="w-full text-left px-3 py-2 text-sm transition-colors hover:opacity-80"
                style={{
                  background: option === value ? 'var(--elevated)' : 'transparent',
                  color: option === value ? 'var(--accent)' : 'var(--text)',
                }}
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
