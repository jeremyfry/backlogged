import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { GripVertical, Clock } from 'lucide-react'
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
import { formatMinutes } from '../lib/format'
import { STATUS_COLORS } from '../lib/constants'

export default function Backlog() {
  const [selected, setSelected] = useState<Game | null>(null)
  const queryClient = useQueryClient()

  const { data: rawGames = [], isLoading } = useQuery({
    queryKey: ['games', { ownershipStatus: 'owned', completionStatus: 'up_next', sort: 'backlogPosition', order: 'asc' }],
    queryFn: () => gamesApi.list({ ownershipStatus: 'owned', completionStatus: 'up_next', sort: 'backlogPosition', order: 'asc' }),
  })

  const backlogged = rawGames
  const [ordered, setOrdered] = useState<Game[]>([])

  useEffect(() => {
    setOrdered(backlogged.sort((a, b) => (a.backlogPosition ?? 0) - (b.backlogPosition ?? 0)))
  }, [rawGames]) // eslint-disable-line react-hooks/exhaustive-deps

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
      // Revert on failure
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

  if (ordered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-8">
        <p className="font-display text-4xl text-text-dim mb-2">EMPTY</p>
        <p className="text-text-muted text-sm">
          No games queued. Set a game's status to "Up Next" to add it here.
        </p>
      </div>
    )
  }

  return (
    <div className="px-3 pt-2">
      <p className="text-xs text-text-muted mb-4 px-1">
        <span className="font-display text-lg text-text mr-1">{ordered.length}</span>
        {ordered.length === 1 ? 'game' : 'games'} up next · drag to reorder
      </p>

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

      <GameDetailSheet game={selected} onClose={() => setSelected(null)} />
    </div>
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

      {/* Status bar (left edge) */}
      <div className="w-1 self-stretch shrink-0" style={{ background: statusColor }} />
    </div>
  )
}
