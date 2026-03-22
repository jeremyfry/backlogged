import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { GripVertical, Clock, Plus, Library, Monitor, Search, X } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Game } from '@backlogged/types'
import { gamesApi } from '../api/games'
import GameDetailSheet from '../components/GameDetailSheet'
import AddGameSheet from '../components/AddGameSheet'
import { formatMinutes } from '../lib/format'
import { STATUS_COLORS } from '../lib/constants'

export default function Backlog() {
  const [selected, setSelected] = useState<Game | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [addDigitalOpen, setAddDigitalOpen] = useState(false)
  const [fromCollectionOpen, setFromCollectionOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Include both owned and digital games in the backlog
  const { data: rawGames = [], isLoading } = useQuery({
    queryKey: ['games', { completionStatus: 'up_next', sort: 'backlogPosition', order: 'asc' }],
    queryFn: () => gamesApi.list({ completionStatus: 'up_next', sort: 'backlogPosition', order: 'asc' }),
  })

  const [ordered, setOrdered] = useState<Game[]>([])

  useEffect(() => {
    setOrdered([...rawGames].sort((a, b) => (a.backlogPosition ?? 0) - (b.backlogPosition ?? 0)))
  }, [rawGames]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = ordered.findIndex(g => g.id === active.id)
    const newIndex = ordered.findIndex(g => g.id === over.id)
    const reordered = arrayMove(ordered, oldIndex, newIndex)
    setOrdered(reordered)

    try {
      await gamesApi.reorderBacklog(reordered.map(g => g.id))
      await queryClient.invalidateQueries({ queryKey: ['games'] })
    } catch {
      setOrdered(ordered)
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="px-3 pt-2 pb-24">
      {ordered.length > 0 && (
        <p className="text-xs text-text-muted mb-4 px-1">
          <span className="font-display text-lg text-text mr-1">{ordered.length}</span>
          {ordered.length === 1 ? 'game' : 'games'} up next · drag to reorder
        </p>
      )}

      {ordered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center px-8">
          <p className="font-display text-4xl text-text-dim mb-2">EMPTY</p>
          <p className="text-text-muted text-sm">
            Nothing queued. Add games from your collection or add digital titles.
          </p>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ordered.map(g => g.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {ordered.map((game, idx) => (
              <SortableBacklogRow
                key={game.id}
                game={game}
                position={idx + 1}
                onClick={() => setSelected(game)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* FAB */}
      <div className="fixed bottom-6 right-4 z-30" ref={menuRef}>
        {menuOpen && (
          <div
            className="absolute bottom-14 right-0 rounded-xl overflow-hidden shadow-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', minWidth: '200px' }}
          >
            <button
              type="button"
              onClick={() => { setFromCollectionOpen(true); setMenuOpen(false) }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:opacity-80 transition-opacity"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <Library size={16} style={{ color: 'var(--accent)' }} />
              From Collection
            </button>
            <button
              type="button"
              onClick={() => { setAddDigitalOpen(true); setMenuOpen(false) }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:opacity-80 transition-opacity"
            >
              <Monitor size={16} style={{ color: 'var(--accent)' }} />
              Add Digital
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
          style={{ background: 'var(--accent)' }}
        >
          {menuOpen
            ? <X size={20} color="#fff" />
            : <Plus size={22} color="#fff" />
          }
        </button>
      </div>

      <GameDetailSheet game={selected} onClose={() => setSelected(null)} />

      <AddGameSheet
        open={addDigitalOpen}
        onClose={() => setAddDigitalOpen(false)}
        defaultOwnershipStatus="digital"
        defaultCompletionStatus="up_next"
      />

      <FromCollectionSheet
        open={fromCollectionOpen}
        onClose={() => setFromCollectionOpen(false)}
        alreadyQueued={ordered.map(g => g.id)}
      />
    </div>
  )
}

function FromCollectionSheet({
  open, onClose, alreadyQueued,
}: { open: boolean; onClose: () => void; alreadyQueued: number[] }) {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: allOwned = [] } = useQuery({
    queryKey: ['games', { ownershipStatus: 'owned' }],
    queryFn: () => gamesApi.list({ ownershipStatus: 'owned' }),
    enabled: open,
  })

  const filtered = allOwned.filter(g =>
    !alreadyQueued.includes(g.id) &&
    g.title.toLowerCase().includes(search.toLowerCase())
  )

  const addToBacklog = async (game: Game) => {
    await gamesApi.update(game.id, { completionStatus: 'up_next' })
    await queryClient.invalidateQueries({ queryKey: ['games'] })
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed left-1/2 z-50 flex flex-col"
        style={{
          top: '56px',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '640px',
          maxHeight: 'calc(92dvh - 56px)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
        }}
      >
        <div className="px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg">From Collection</h2>
            <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              className="input pl-9"
              placeholder="Search collection…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-3 pb-5">
          {filtered.length === 0 && (
            <p className="text-center text-text-muted text-sm py-8">
              {allOwned.length === 0 ? 'No games in collection.' : 'No results.'}
            </p>
          )}
          <div className="space-y-1">
            {filtered.map(game => (
              <button
                key={game.id}
                type="button"
                onClick={() => addToBacklog(game)}
                className="w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors hover:opacity-80"
                style={{ background: 'var(--elevated)' }}
              >
                <div className="w-8 h-12 rounded-lg shrink-0 overflow-hidden" style={{ background: 'var(--card)' }}>
                  {game.coverArtUrl
                    ? <img src={game.coverArtUrl} alt={game.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-sm" style={{ color: 'var(--text-dim)' }}>{game.title[0]}</span>
                      </div>
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{game.title}</p>
                  <p className="text-xs text-text-muted">{game.platform}</p>
                </div>
                <Plus size={16} className="ml-auto shrink-0" style={{ color: 'var(--accent)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function SortableBacklogRow({
  game, position, onClick,
}: { game: Game; position: number; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: game.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
  }

  const statusColor = STATUS_COLORS[game.completionStatus] ?? 'transparent'

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: 'var(--surface)', border: '1px solid var(--border)' }}
      className="flex items-center gap-3 rounded-xl overflow-hidden"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="pl-3 py-4 text-text-dim cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical size={18} />
      </div>

      {/* Position number */}
      <span className="font-display text-2xl w-7 text-center shrink-0"
            style={{ color: position === 1 ? 'var(--accent)' : 'var(--text-dim)' }}>
        {position}
      </span>

      {/* Cover thumbnail */}
      <div className="w-10 h-14 shrink-0 rounded-lg overflow-hidden" style={{ background: 'var(--elevated)' }}>
        {game.coverArtUrl ? (
          <img src={game.coverArtUrl} alt={game.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-lg" style={{ color: 'var(--text-dim)' }}>{game.title[0]}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-3 pr-2" onClick={onClick} style={{ cursor: 'pointer' }}>
        <p className="font-semibold text-sm truncate">{game.title}</p>
        <p className="text-xs text-text-muted">{game.platform}</p>
        {game.hltbMainStory && (
          <div className="flex items-center gap-1 mt-1">
            <Clock size={10} style={{ color: 'var(--accent)' }} />
            <span className="text-[10px] text-text-muted">{formatMinutes(game.hltbMainStory)}</span>
          </div>
        )}
      </div>

      {/* Status bar (right edge) */}
      <div className="w-1 self-stretch shrink-0" style={{ background: statusColor }} />
    </div>
  )
}
