import { useEffect, useRef } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function Sheet({ open, onClose, title, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Trap focus and close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`sheet-backdrop ${open ? 'sheet-backdrop-visible' : 'sheet-backdrop-enter pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={`sheet-panel ${open ? 'sheet-panel-visible' : 'sheet-panel-hidden'}`}
      >
        {title && (
          <h2 className="font-display text-3xl px-5 pt-1 pb-3 shrink-0">{title}</h2>
        )}

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pb-12 pb-safe">
          {children}
        </div>
      </div>
    </>
  )
}
