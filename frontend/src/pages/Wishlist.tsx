import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, X } from 'lucide-react'
import type { Game } from '@backlogged/types'
import { gamesApi } from '../api/games'
import GameCard from '../components/GameCard'
import AddGameSheet from '../components/AddGameSheet'
import GameDetailSheet from '../components/GameDetailSheet'
import { CONDITIONS } from '../lib/constants'

export default function Wishlist() {
  const [addOpen, setAddOpen] = useState(false)
  const [selected, setSelected] = useState<Game | null>(null)
  const [search, setSearch] = useState('')

  const params = {
    ownershipStatus: 'wishlist',
    sort: 'title',
    order: 'asc' as const,
    ...(search.trim() ? { search: search.trim() } : {}),
  }

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games', params],
    queryFn: () => gamesApi.list(params),
  })

  return (
    <div className="px-3 pt-2">
      {/* Search */}
      <div className="mb-3 sticky top-14 z-20 py-2" style={{ background: 'var(--bg)' }}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search wishlist…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {!isLoading && (
        <p className="text-xs text-text-muted mb-3 px-1">
          <span className="font-display text-lg text-text mr-1">{games.length}</span>
          {games.length === 1 ? 'item' : 'items'} on wishlist
        </p>
      )}

      {/* Grid - show condition overlaid on cards */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl animate-pulse"
                 style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-display text-4xl text-text-dim mb-2">EMPTY</p>
          <p className="text-text-muted text-sm">Nothing on your wishlist yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {games.map(game => (
            <WishlistCard key={game.id} game={game} onClick={() => setSelected(game)} />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-24 right-4 z-20 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
        style={{ background: 'var(--accent)', boxShadow: '0 4px 24px rgba(249,115,22,0.4)' }}
        aria-label="Add to wishlist"
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </button>

      <AddGameSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <GameDetailSheet game={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function WishlistCard({ game, onClick }: { game: Game; onClick: () => void }) {
  const conditionLabel = CONDITIONS.find(c => c.value === game.condition)?.label

  return (
    <div className="relative">
      <GameCard game={game} onClick={onClick} />
      {conditionLabel && (
        <div className="absolute bottom-5 inset-x-0 flex justify-center px-1 pointer-events-none">
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(249,115,22,0.85)', color: '#fff' }}>
            {conditionLabel}
          </span>
        </div>
      )}
    </div>
  )
}
