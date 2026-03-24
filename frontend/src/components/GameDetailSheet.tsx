import { useState, useEffect } from 'react'
import { X, Pencil, Trash2, Clock, Tag } from 'lucide-react'
import type { Game, CompletionStatus, IgdbSearchResult } from '@backlogged/types'
import { gamesApi } from '../api/games'
import { igdbApi } from '../api/igdb'
import { useQueryClient } from '@tanstack/react-query'
import GameForm from './GameForm'
import { formatMinutes, formatCurrency, formatDate } from '../lib/format'
import { STATUS_COLORS, STATUS_LABELS, CONDITIONS, COMPLETION_STATUSES } from '../lib/constants'

interface Props {
  game: Game | null
  onClose: () => void
}

export default function GameDetailSheet({ game, onClose }: Props) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState(game?.completionStatus ?? 'unplayed')
  const [igdbData, setIgdbData] = useState<IgdbSearchResult | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (game) setStatus(game.completionStatus)
  }, [game?.id])

  useEffect(() => {
    if (game) requestAnimationFrame(() => setVisible(true))
  }, [game])

  useEffect(() => {
    if (editing && game?.igdbId) {
      igdbApi.getById(game.igdbId).then(setIgdbData).catch(() => {})
    } else if (!editing) {
      setIgdbData(null)
    }
  }, [editing, game?.igdbId])

  useEffect(() => {
    if (!game) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [game])

  useEffect(() => {
    document.body.style.overflow = game ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [game])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => { setEditing(false); setConfirmDelete(false); onClose() }, 220)
  }

  const handleUpdate = async (data: Parameters<typeof gamesApi.update>[1]) => {
    if (!game) return
    await gamesApi.update(game.id, data)
    await queryClient.invalidateQueries({ queryKey: ['games'] })
    setEditing(false)
    handleClose()
  }

  const handleDelete = async () => {
    if (!game) return
    await gamesApi.delete(game.id)
    await queryClient.invalidateQueries({ queryKey: ['games'] })
    handleClose()
  }

  const handleStatusChange = async (newStatus: CompletionStatus) => {
    if (!game) return
    setStatus(newStatus)
    await gamesApi.update(game.id, { completionStatus: newStatus })
    await queryClient.invalidateQueries({ queryKey: ['games'] })
  }

  if (!game) return null

  const statusColor = STATUS_COLORS[status] ?? 'transparent'
  const conditionLabel = CONDITIONS.find(c => c.value === game.condition)?.label ?? game.condition

  const transitionStyle = {
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.22s ease',
  }

  const dialogStyle = {
    transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(12px)',
    transition: 'transform 0.22s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.22s ease',
    opacity: visible ? 1 : 0,
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', ...transitionStyle }}
        onClick={handleClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full flex flex-col rounded-2xl overflow-hidden"
          style={{
            maxWidth: 480,
            maxHeight: '88dvh',
            background: 'var(--surface)',
            border: '1px solid var(--border-bright)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            ...dialogStyle,
          }}
          onClick={e => e.stopPropagation()}
        >
          {editing ? (
            /* ── Edit view ─────────────────────────── */
            <>
              <div className="flex items-center justify-between px-5 py-4 shrink-0"
                   style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-display text-2xl">Edit Game</h2>
                <button className="p-1 rounded-lg text-text-muted hover:text-text transition-colors"
                        onClick={() => setEditing(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-5 py-4 pb-safe">
                <GameForm
                  initial={game}
                  igdbData={igdbData}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditing(false)}
                  submitLabel="Save Changes"
                />
              </div>
            </>
          ) : (
            /* ── Detail view ───────────────────────── */
            <>
              {/* Hero art */}
              <div className="relative shrink-0 flex items-center justify-center overflow-hidden"
                   style={{ height: 280, background: 'var(--elevated)' }}>
                {game.coverArtUrl ? (
                  <>
                    {/* Blurred background */}
                    <img
                      src={game.coverArtUrl}
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ filter: 'blur(24px) brightness(0.35)', transform: 'scale(1.1)' }}
                    />
                    {/* Full art — no cropping */}
                    <img
                      src={game.coverArtUrl}
                      alt={game.title}
                      className="relative z-10 h-full w-auto object-contain drop-shadow-2xl"
                      style={{ maxWidth: '65%' }}
                    />
                  </>
                ) : (
                  <span className="font-display text-5xl text-center leading-tight px-6"
                        style={{ color: 'var(--text-dim)' }}>
                    {game.title}
                  </span>
                )}

                {/* Close button */}
                <button
                  className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
                  onClick={handleClose}
                  aria-label="Close"
                >
                  <X size={16} color="white" />
                </button>
              </div>

              {/* Title block — solid background for readability */}
              <div className="px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-display text-4xl leading-tight">{game.title}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {game.platform}
                  {game.language && game.language !== 'English' ? ` · ${game.language}` : ''}
                  {game.releaseYear ? ` · ${game.releaseYear}` : ''}
                </p>
                <div className="inline-flex items-center gap-1.5 mt-2 rounded-full px-2.5 py-0.5"
                     style={{ background: `${statusColor}28`, border: `1px solid ${statusColor}50` }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColor }} />
                  <select
                    value={status}
                    onChange={e => handleStatusChange(e.target.value as CompletionStatus)}
                    className="text-xs font-semibold bg-transparent border-none outline-none cursor-pointer appearance-none pr-3"
                    style={{ color: statusColor }}
                  >
                    {COMPLETION_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-5 pt-4 pb-6 pb-safe space-y-4">

                {/* Personal playthrough */}
                {(game.personalPlaytime || game.completionDate) && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest mb-2 flex items-center gap-1.5"
                       style={{ color: 'var(--text-muted)' }}>
                      <Clock size={11} /> My Playthrough
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      {game.personalPlaytime != null && (
                        <div className="rounded-xl py-3"
                             style={{ background: 'var(--elevated)', border: '1px solid var(--accent)40' }}>
                          <p className="text-[10px] uppercase tracking-widest mb-1"
                             style={{ color: 'var(--text-muted)' }}>Time Played</p>
                          <p className="font-display text-2xl">{formatMinutes(game.personalPlaytime)}</p>
                        </div>
                      )}
                      {game.completionDate && (
                        <div className="rounded-xl py-3"
                             style={{ background: 'var(--elevated)', border: '1px solid var(--accent)40' }}>
                          <p className="text-[10px] uppercase tracking-widest mb-1"
                             style={{ color: 'var(--text-muted)' }}>Completed</p>
                          <p className="font-display text-2xl">{formatDate(game.completionDate)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Time to beat */}
                {(game.hltbMainStory || game.hltbExtras || game.hltbCompletionist) && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest mb-2 flex items-center gap-1.5"
                       style={{ color: 'var(--text-muted)' }}>
                      <Clock size={11} /> Time to Beat
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Main', val: game.hltbMainStory },
                        { label: 'Extras', val: game.hltbExtras },
                        { label: '100%', val: game.hltbCompletionist },
                      ].map(({ label, val }) => (
                        <div key={label} className="rounded-xl py-3"
                             style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                          <p className="text-[10px] uppercase tracking-widest mb-1"
                             style={{ color: 'var(--text-muted)' }}>{label}</p>
                          <p className="font-display text-2xl">{formatMinutes(val)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata grid */}
                {(() => {
                  const items = [
                    { label: 'Condition', value: conditionLabel },
                    { label: 'Rating', value: game.personalRating ? `${game.personalRating} / 10` : null },
                    { label: 'Genre', value: game.genre },
                    { label: 'Developer', value: game.developer },
                    game.ownershipStatus === 'owned'
                      ? { label: 'Paid', value: formatCurrency(game.purchasePrice) }
                      : { label: 'Target', value: formatCurrency(game.targetPrice) },
                    game.ownershipStatus === 'owned'
                      ? { label: 'Acquired', value: formatDate(game.purchaseDate) }
                      : null,
                    { label: 'From', value: game.purchaseLocation },
                  ].filter(Boolean).filter(i => i!.value && i!.value !== '—')

                  return items.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {items.map(item => (
                        <div key={item!.label} className="rounded-xl p-3"
                             style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                          <p className="text-[10px] uppercase tracking-widest"
                             style={{ color: 'var(--text-muted)' }}>{item!.label}</p>
                          <p className="text-sm font-semibold mt-1 truncate">{item!.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null
                })()}

                {/* Notes */}
                {game.notes && (
                  <div className="rounded-xl p-3.5"
                       style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                    <p className="text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5"
                       style={{ color: 'var(--text-muted)' }}>
                      <Tag size={11} /> Notes
                    </p>
                    <p className="text-sm leading-relaxed">{game.notes}</p>
                  </div>
                )}

                {/* Actions */}
                {confirmDelete ? (
                  <div className="space-y-2">
                    <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                      Delete <strong style={{ color: 'var(--text)' }}>{game.title}</strong>?
                    </p>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost flex-1" onClick={() => setConfirmDelete(false)}>Cancel</button>
                      <button className="btn btn-danger flex-1" onClick={handleDelete}>Delete</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button className="btn btn-ghost flex-1" onClick={() => setEditing(true)}>
                      <Pencil size={15} /> Edit
                    </button>
                    <button className="btn btn-ghost flex-1"
                            style={{ color: 'var(--red)', borderColor: 'rgba(244,63,94,0.3)' }}
                            onClick={() => setConfirmDelete(true)}>
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
