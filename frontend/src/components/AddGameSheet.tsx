import { useState, useEffect, useRef } from 'react'
import { Search, ArrowLeft } from 'lucide-react'
import type { IgdbSearchResult, CreateGameInput, OwnershipStatus, CompletionStatus } from '@backlogged/types'
import { igdbApi } from '../api/igdb'
import { gamesApi } from '../api/games'
import { normalizeIgdbPlatform } from '../lib/constants'
import { useQueryClient } from '@tanstack/react-query'
import Sheet from './Sheet'
import GameForm from './GameForm'

interface Props {
  open: boolean
  onClose: () => void
  defaultOwnershipStatus?: OwnershipStatus
  defaultCompletionStatus?: CompletionStatus
}

type Step = 'search' | 'form'

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export default function AddGameSheet({ open, onClose, defaultOwnershipStatus, defaultCompletionStatus }: Props) {
  const [step, setStep] = useState<Step>('search')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<IgdbSearchResult[]>([])
  const [selected, setSelected] = useState<IgdbSearchResult | null>(null)
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 450)

  // Auto-focus search on open
  useEffect(() => {
    if (open && step === 'search') {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open, step])

  // IGDB search
  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return }
    setSearching(true)
    igdbApi.search(debouncedQuery)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setSearching(false))
  }, [debouncedQuery])

  const reset = () => {
    setStep('search')
    setQuery('')
    setResults([])
    setSelected(null)
  }

  const handleClose = () => { reset(); onClose() }

  const selectGame = (game: IgdbSearchResult) => {
    setSelected(game)
    setStep('form')
  }

  const handleManual = () => {
    setSelected(null)
    setStep('form')
  }

  const handleSave = async (data: CreateGameInput) => {
    await gamesApi.create(data)
    await queryClient.invalidateQueries({ queryKey: ['games'] })
    handleClose()
  }

  const initialFromIgdb = selected
    ? {
        title: selected.title,
        platform: normalizeIgdbPlatform(selected.platforms[0] ?? ''),
        coverArtUrl: selected.coverUrl,
        igdbId: selected.igdbId,
        releaseYear: selected.releaseYear,
        genre: selected.genres[0] ?? null,
        developer: selected.developer,
        publisher: selected.publisher,
      } satisfies Partial<CreateGameInput>
    : undefined

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={step === 'search' ? 'Add Game' : undefined}
    >
      {step === 'search' && (
        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              ref={inputRef}
              className="input pl-9"
              placeholder="Search IGDB…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {/* Results */}
          {searching && (
            <p className="text-center text-text-muted text-sm py-4">Searching…</p>
          )}

          {!searching && results.length > 0 && (
            <ul className="space-y-2">
              {results.map(game => (
                <li key={game.igdbId}>
                  <button
                    type="button"
                    onClick={() => selectGame(game)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors"
                    style={{ background: 'var(--elevated)' }}
                  >
                    {game.coverUrl ? (
                      <img src={game.coverUrl.replace('t_cover_big', 't_thumb')} alt={game.title}
                           className="w-10 h-14 object-cover rounded-lg shrink-0" />
                    ) : (
                      <div className="w-10 h-14 rounded-lg shrink-0 flex items-center justify-center"
                           style={{ background: 'var(--card)' }}>
                        <span className="font-display text-lg text-text-dim">{game.title[0]}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{game.title}</p>
                      <p className="text-xs text-text-muted">
                        {[game.releaseYear, game.platforms.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!searching && query && results.length === 0 && (
            <p className="text-center text-text-muted text-sm py-4">No results found</p>
          )}

          {/* Manual entry */}
          <button
            type="button"
            onClick={handleManual}
            className="w-full text-center text-sm text-text-muted py-2 hover:text-text transition-colors"
          >
            Add manually without IGDB →
          </button>
        </div>
      )}

      {step === 'form' && (
        <>
          <button
            type="button"
            onClick={() => setStep('search')}
            className="flex items-center gap-2 text-sm text-text-muted mb-4 hover:text-text transition-colors"
          >
            <ArrowLeft size={14} /> Back to search
          </button>
          <GameForm
            initial={{
              ...(defaultOwnershipStatus && { ownershipStatus: defaultOwnershipStatus }),
              ...(defaultCompletionStatus && { completionStatus: defaultCompletionStatus }),
              ...initialFromIgdb,
            }}
            igdbData={selected}
            onSubmit={handleSave}
            onCancel={handleClose}
            submitLabel="Add to Collection"
          />
        </>
      )}
    </Sheet>
  )
}
