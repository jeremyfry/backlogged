import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import type { Game } from '@backlogged/types'
import { gamesApi, type ListGamesParams } from '../api/games'
import GameCard from '../components/GameCard'
import AddGameSheet from '../components/AddGameSheet'
import GameDetailSheet from '../components/GameDetailSheet'
import { COMPLETION_STATUSES } from '../lib/constants'

const SORT_OPTIONS = [
  { value: 'title',          label: 'Title' },
  { value: 'platform',       label: 'Platform' },
  { value: 'releaseYear',    label: 'Year' },
  { value: 'personalRating', label: 'Rating' },
]

export default function Collection() {
  const [addOpen, setAddOpen]     = useState(false)
  const [selected, setSelected]   = useState<Game | null>(null)
  const [search, setSearch]       = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters]     = useState<ListGamesParams>({
    ownershipStatus: 'owned',
    sort: 'title',
    order: 'asc',
  })

  const params: ListGamesParams = {
    ...filters,
    ...(search.trim() ? { search: search.trim() } : {}),
  }

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games', params],
    queryFn: () => gamesApi.list(params),
  })

  // Separate query just to populate platform chips — unaffected by active filters
  const { data: allOwned = [] } = useQuery({
    queryKey: ['games', { ownershipStatus: 'owned' }],
    queryFn: () => gamesApi.list({ ownershipStatus: 'owned' }),
  })
  const platforms = Array.from(
    new Set(allOwned.map(g => g.platform).filter(Boolean))
  ).sort() as string[]

  return (
    <div className="px-3 pt-2">
      <div className="flex flex-col gap-1.5 sticky top-14 z-20 pt-2 pb-2" style={{ background: 'var(--bg)' }}>
        {/* Search + sort toggle row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
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
          <button
            onClick={() => setFilterOpen(f => !f)}
            className="btn btn-ghost px-3"
            style={filterOpen ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
            aria-label="Sort options"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* Filter dropdowns */}
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

      {/* Sort panel */}
      {filterOpen && (
        <div className="mb-3 p-3 rounded-xl"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1">Sort by</label>
              <select className="input text-sm py-2"
                      value={filters.sort ?? 'title'}
                      onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1">Order</label>
              <select className="input text-sm py-2"
                      value={filters.order ?? 'asc'}
                      onChange={e => setFilters(f => ({ ...f, order: e.target.value as 'asc' | 'desc' }))}>
                <option value="asc">A → Z</option>
                <option value="desc">Z → A</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      {!isLoading && (
        <p className="text-xs text-text-muted mb-3 px-1">
          <span className="font-display text-lg text-text mr-1">{games.length}</span>
          {games.length === 1 ? 'game' : 'games'}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl animate-pulse"
                 style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-display text-4xl text-text-dim mb-2">EMPTY</p>
          <p className="text-text-muted text-sm">Add your first game with the + button</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {games.map(game => (
            <GameCard key={game.id} game={game} onClick={() => setSelected(game)} />
          ))}
        </div>
      )}

      {/* FAB */}
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
