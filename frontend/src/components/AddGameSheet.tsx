import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, ArrowLeft, Settings as SettingsIcon, X } from 'lucide-react'
import type { IgdbSearchResult, CreateGameInput, OwnershipStatus, CompletionStatus } from '@backlogged/types'
import { igdbApi } from '../api/igdb'
import { gamesApi } from '../api/games'
import { normalizeIgdbPlatform } from '../lib/constants'
import { useSettings } from '../hooks/useSettings'
import { useQueryClient } from '@tanstack/react-query'
import Sheet from './Sheet'
import GameForm from './GameForm'
import PlatformFilterPicker, { isPlatformFilterActive } from './PlatformFilterPicker'

interface Props {
  open: boolean
  onClose: () => void
  defaultOwnershipStatus?: OwnershipStatus
  defaultCompletionStatus?: CompletionStatus
}

type Step = 'search' | 'form'

const BEFORE_YEAR_STORAGE_KEY = 'igdb-search-before-year'

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
  // Persisted across sessions — a "before year" filter you set once tends to apply to every search you do.
  const [beforeYear, setBeforeYear] = useState(() => localStorage.getItem(BEFORE_YEAR_STORAGE_KEY) ?? '')
  const [searching, setSearching] = useState(false)
  const [rawResults, setRawResults] = useState<IgdbSearchResult[]>([])
  const [selected, setSelected] = useState<IgdbSearchResult | null>(null)
  const [platformPickerOpen, setPlatformPickerOpen] = useState(false)
  const platformPickerRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const debouncedQuery = useDebounce(query, 450)
  const debouncedBeforeYear = useDebounce(beforeYear, 600)
  const { settings, update: updateSettings } = useSettings()

  const beforeYearNum = debouncedBeforeYear ? parseInt(debouncedBeforeYear, 10) : undefined
  const platformFilterActive = isPlatformFilterActive(settings.igdbPlatforms)

  // IGDB fetch — only re-runs when the query or year filter changes, not when settings change
  useEffect(() => {
    if (!debouncedQuery.trim()) { setRawResults([]); return }
    setSearching(true)
    igdbApi.search(debouncedQuery, {
      beforeYear: Number.isFinite(beforeYearNum) ? beforeYearNum : undefined,
    })
      .then(setRawResults)
      .catch(() => setRawResults([]))
      .finally(() => setSearching(false))
  }, [debouncedQuery, beforeYearNum])

  // Filter is a pure derivation — updates instantly when settings change, no re-fetch
  const results = useMemo(() => {
    if (!platformFilterActive) return rawResults
    return rawResults.filter(game =>
      game.platforms.some(p => settings.igdbPlatforms.includes(normalizeIgdbPlatform(p)))
    )
  }, [rawResults, settings.igdbPlatforms, platformFilterActive])

  // Close platform picker on outside click
  useEffect(() => {
    if (!platformPickerOpen) return
    const handler = (e: MouseEvent) => {
      if (platformPickerRef.current && !platformPickerRef.current.contains(e.target as Node)) {
        setPlatformPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [platformPickerOpen])

  const setBeforeYearPersisted = (value: string) => {
    setBeforeYear(value)
    if (value) localStorage.setItem(BEFORE_YEAR_STORAGE_KEY, value)
    else localStorage.removeItem(BEFORE_YEAR_STORAGE_KEY)
  }

  const reset = () => {
    setStep('search')
    setQuery('')
    setRawResults([])
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

  const handleSave = async (data: CreateGameInput, addAnother: boolean) => {
    await gamesApi.create(data)
    await queryClient.invalidateQueries({ queryKey: ['games'] })
    if (addAnother) {
      reset()
    } else {
      handleClose()
    }
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
      {open && step === 'search' && (
        <div className="space-y-4">
          {/* Search input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                autoFocus
                className="input pl-9"
                placeholder="Search IGDB…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <input
                className="input w-24 text-center"
                type="number"
                min="1970"
                max={new Date().getFullYear()}
                placeholder="Before"
                value={beforeYear}
                onChange={e => setBeforeYearPersisted(e.target.value)}
              />
              {beforeYear && (
                <button
                  type="button"
                  onClick={() => setBeforeYearPersisted('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="relative" ref={platformPickerRef}>
              <button
                type="button"
                onClick={() => setPlatformPickerOpen(o => !o)}
                aria-label="Platform filter"
                className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors shrink-0"
                style={platformFilterActive
                  ? { color: 'var(--accent)', background: 'var(--elevated)' }
                  : { color: 'var(--text-muted)', background: 'var(--elevated)' }
                }
              >
                <SettingsIcon size={16} />
              </button>
              {platformPickerOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-30 rounded-xl overflow-hidden shadow-xl p-3"
                  style={{
                    width: 280,
                    maxHeight: 320,
                    overflowY: 'auto',
                    background: 'var(--surface)',
                    border: '1px solid var(--border-bright)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  <PlatformFilterPicker
                    selected={settings.igdbPlatforms}
                    onChange={igdbPlatforms => updateSettings({ igdbPlatforms })}
                  />
                </div>
              )}
            </div>
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
                        {[
                          game.releaseYear,
                          (platformFilterActive
                            ? game.platforms.filter(p => settings.igdbPlatforms.includes(normalizeIgdbPlatform(p)))
                            : game.platforms.slice(0, 2)
                          ).map(normalizeIgdbPlatform).join(', '),
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!searching && query && results.length === 0 && rawResults.length > 0 && (
            <p className="text-center text-text-muted text-sm py-4">
              {rawResults.length} result{rawResults.length !== 1 ? 's' : ''} found, but hidden by your platform filter.{' '}
              <button type="button" onClick={() => setPlatformPickerOpen(true)} className="text-accent hover:underline">
                Adjust platforms
              </button>
            </p>
          )}

          {!searching && query && results.length === 0 && rawResults.length === 0 && (
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
              ...(settings.defaultCondition && { condition: settings.defaultCondition }),
              ...initialFromIgdb,
            }}
            igdbData={selected}
            onSubmit={handleSave}
            onCancel={handleClose}
            submitLabel="Add to Collection"
            allowAddAnother
          />
        </>
      )}
    </Sheet>
  )
}
