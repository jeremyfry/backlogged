import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, X, LayoutGrid, Image, List, ChevronDown } from 'lucide-react'
import type { Game } from '@backlogged/types'
import { gamesApi, type ListGamesParams } from '../api/games'
import GameCard from '../components/GameCard'
import AddGameSheet from '../components/AddGameSheet'
import GameDetailSheet from '../components/GameDetailSheet'
import { COMPLETION_STATUSES, STATUS_COLORS, STATUS_LABELS } from '../lib/constants'

const SORT_OPTIONS = [
  { value: 'title',          label: 'Title' },
  { value: 'platform',       label: 'Platform' },
  { value: 'releaseYear',    label: 'Year' },
  { value: 'personalRating', label: 'Rating' },
]

type ViewMode = 'cards' | 'art' | 'list'

const VIEW_ICONS: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: 'cards', icon: LayoutGrid, label: 'Card view' },
  { mode: 'art',   icon: Image,      label: 'Art view' },
  { mode: 'list',  icon: List,       label: 'List view' },
]

export default function Collection() {
  const [addOpen, setAddOpen]     = useState(false)
  const [selected, setSelected]   = useState<Game | null>(null)
  const [search, setSearch]       = useState('')
  const [sortOpen, setSortOpen]   = useState(false)
  const [view, setView]           = useState<ViewMode>(
    () => (localStorage.getItem('collection-view') as ViewMode) ?? 'cards'
  )
  const [filters, setFilters] = useState<ListGamesParams>({
    ownershipStatus: 'owned',
    sort: 'title',
    order: 'asc',
  })

  const sortRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!sortOpen) return
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen])

  const params: ListGamesParams = {
    ...filters,
    ...(search.trim() ? { search: search.trim() } : {}),
  }

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games', params],
    queryFn: () => gamesApi.list(params),
  })

  const { data: allOwned = [] } = useQuery({
    queryKey: ['games', { ownershipStatus: 'owned' }],
    queryFn: () => gamesApi.list({ ownershipStatus: 'owned' }),
  })
  const platforms = Array.from(
    new Set(allOwned.map(g => g.platform).filter(Boolean))
  ).sort() as string[]

  const setViewMode = (m: ViewMode) => {
    setView(m)
    localStorage.setItem('collection-view', m)
  }

  const activeSortLabel = SORT_OPTIONS.find(o => o.value === (filters.sort ?? 'title'))?.label ?? 'Title'

  return (
    <div className="px-3 pt-2">
      {/* Sticky header: search + filters */}
      <div className="flex flex-col gap-1.5 sticky z-20 pt-2 pb-2" style={{ background: 'var(--bg)' }}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search collection…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <select
            className="input text-xs py-1.5 flex-1"
            value={filters.completionStatus ?? ''}
            onChange={e => setFilters(f => ({ ...f, completionStatus: e.target.value || undefined }))}
          >
            <option value="">All Statuses</option>
            {COMPLETION_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            className="input text-xs py-1.5 flex-1"
            value={filters.platform ?? ''}
            onChange={e => setFilters(f => ({ ...f, platform: e.target.value || undefined }))}
          >
            <option value="">All Systems</option>
            {platforms.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats + sort + view toggle */}
      <div className="flex items-center justify-between mb-2 px-1">
        {/* Count + sort popover */}
        <div className="flex items-center gap-2">
          {!isLoading && (
            <p className="text-xs text-text-muted">
              <span className="font-display text-lg text-text mr-1">{games.length}</span>
              {games.length === 1 ? 'game' : 'games'}
            </p>
          )}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen(o => !o)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
              style={sortOpen
                ? { color: 'var(--accent)', background: 'var(--elevated)' }
                : { color: 'var(--text-muted)', background: 'var(--elevated)' }
              }
            >
              Sort: {activeSortLabel}
              <ChevronDown size={12} style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {sortOpen && (
              <div
                className="absolute left-0 top-full mt-1 z-30 rounded-xl overflow-hidden shadow-xl"
                style={{
                  minWidth: 160,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-bright)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => { setFilters(f => ({ ...f, sort: o.value })); setSortOpen(false) }}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-left transition-colors hover:bg-elevated"
                    style={{ color: filters.sort === o.value ? 'var(--accent)' : 'var(--text)' }}
                  >
                    {o.label}
                    {filters.sort === o.value && <span className="text-xs">✓</span>}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  {(['asc', 'desc'] as const).map(ord => (
                    <button
                      key={ord}
                      onClick={() => { setFilters(f => ({ ...f, order: ord })); setSortOpen(false) }}
                      className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-left transition-colors hover:bg-elevated"
                      style={{ color: filters.order === ord ? 'var(--accent)' : 'var(--text-muted)' }}
                    >
                      {ord === 'asc' ? 'A → Z' : 'Z → A'}
                      {filters.order === ord && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View icons */}
        <div className="flex items-center gap-0.5">
          {VIEW_ICONS.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              aria-label={label}
              className="p-1.5 rounded-lg transition-colors"
              style={view === mode
                ? { color: 'var(--accent)', background: 'var(--elevated)' }
                : { color: 'var(--text-dim)' }
              }
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton view={view} />
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-display text-4xl text-text-dim mb-2">EMPTY</p>
          <p className="text-text-muted text-sm">Add your first game with the + button</p>
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {games.map(game => (
            <GameCard key={game.id} game={game} onClick={() => setSelected(game)} />
          ))}
        </div>
      ) : view === 'art' ? (
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6">
          {games.map(game => {
            const statusColor = STATUS_COLORS[game.completionStatus] ?? 'transparent'
            return (
              <button
                key={game.id}
                onClick={() => setSelected(game)}
                className="relative overflow-hidden rounded-lg focus:outline-none"
                style={{ aspectRatio: '2/3' }}
                aria-label={game.title}
              >
                {game.coverArtUrl ? (
                  <img src={game.coverArtUrl} alt={game.title}
                       className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-1"
                       style={{ background: 'var(--elevated)' }}>
                    <span className="font-display text-[10px] text-center leading-tight"
                          style={{ color: 'var(--text-dim)' }}>
                      {game.title}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 h-[3px]"
                     style={{ background: statusColor }} />
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-1.5">
          {games.map(game => {
            const statusColor = STATUS_COLORS[game.completionStatus] ?? 'var(--border)'
            return (
              <button
                key={game.id}
                onClick={() => setSelected(game)}
                className="flex items-center gap-3 w-full rounded-xl text-left transition-colors"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="w-[3px] self-stretch rounded-l-xl shrink-0"
                     style={{ background: statusColor }} />
                <div className="w-9 h-[52px] shrink-0 rounded-md overflow-hidden my-2"
                     style={{ background: 'var(--elevated)' }}>
                  {game.coverArtUrl ? (
                    <img src={game.coverArtUrl} alt={game.title}
                         className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-display text-sm" style={{ color: 'var(--text-dim)' }}>
                        {game.title[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-2">
                  <p className="text-sm font-semibold truncate">{game.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{game.platform}</p>
                </div>
                <div className="text-right shrink-0 pr-3 py-2">
                  <p className="text-xs font-semibold" style={{ color: statusColor }}>
                    {STATUS_LABELS[game.completionStatus]}
                  </p>
                  {game.personalRating != null && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {game.personalRating}/10
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-24 right-4 z-20 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
        style={{ background: 'var(--accent)', boxShadow: '0 4px 24px rgba(249,115,22,0.4)' }}
        aria-label="Add game"
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </button>

      <AddGameSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <GameDetailSheet game={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function LoadingSkeleton({ view }: { view: ViewMode }) {
  if (view === 'list') {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[68px] rounded-xl animate-pulse"
               style={{ background: 'var(--surface)' }} />
        ))}
      </div>
    )
  }
  if (view === 'art') {
    return (
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="rounded-lg animate-pulse"
               style={{ aspectRatio: '2/3', background: 'var(--surface)' }} />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-[2/3] rounded-xl animate-pulse"
             style={{ background: 'var(--surface)' }} />
      ))}
    </div>
  )
}
