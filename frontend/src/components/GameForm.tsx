import { useState, useRef } from 'react'
import { Clock, RefreshCw, Upload } from 'lucide-react'
import type { CreateGameInput, IgdbSearchResult, HltbResult } from '@backlogged/types'
import { PLATFORMS, LANGUAGES, CONDITIONS, COMPLETION_STATUSES } from '../lib/constants'
import Combobox from './Combobox'
import { formatMinutes } from '../lib/format'
import { hltbApi } from '../api/hltb'
import { uploadsApi } from '../api/uploads'

interface Props {
  initial?: Partial<CreateGameInput>
  igdbData?: IgdbSearchResult | null
  onSubmit: (data: CreateGameInput) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

const PLATFORM_LANGUAGE: Record<string, string> = {
  'Famicom':       'Japanese',
  'Super Famicom': 'Japanese',
}

const DEFAULT: CreateGameInput = {
  title: '',
  platform: '',
  language: 'English',
  ownershipStatus: 'owned',
  completionStatus: 'unplayed',
  condition: null,
  genre: null,
  developer: null,
  publisher: null,
  releaseYear: null,
  coverArtUrl: null,
  igdbId: null,
  personalRating: null,
  hltbMainStory: null,
  hltbExtras: null,
  hltbCompletionist: null,
  notes: null,
  completionDate: null,
  personalPlaytime: null,
  purchasePrice: null,
  purchaseDate: null,
  purchaseLocation: null,
  targetPrice: null,
  backlogPosition: null,
}

export default function GameForm({ initial, igdbData, onSubmit, onCancel, submitLabel = 'Save' }: Props) {
  const [form, setForm] = useState<CreateGameInput>({ ...DEFAULT, ...initial })
  const [saving, setSaving] = useState(false)
  const [hltbLoading, setHltbLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadsApi.upload(file)
      set('coverArtUrl', url)
    } catch {
      setError('Image upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const set = <K extends keyof CreateGameInput>(key: K, value: CreateGameInput[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const fetchHltb = async () => {
    if (!form.title) return
    setHltbLoading(true)
    try {
      const results = await hltbApi.search(form.title)
      if (results[0]) {
        set('hltbMainStory', results[0].mainStory)
        set('hltbExtras', results[0].mainExtra)
        set('hltbCompletionist', results[0].completionist)
      }
    } catch {
      // silently fail — HLTB is optional
    } finally {
      setHltbLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const isOwned = form.ownershipStatus === 'owned'
  const isDigital = form.ownershipStatus === 'digital'
  const isWishlist = form.ownershipStatus === 'wishlist'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Ownership toggle */}
      <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
        {([
          { value: 'owned', label: 'Owned' },
          { value: 'digital', label: 'Digital' },
          { value: 'wishlist', label: 'Wishlist' },
        ] as const).map(s => (
          <button
            key={s.value}
            type="button"
            onClick={() => set('ownershipStatus', s.value)}
            className="flex-1 py-2.5 text-sm font-semibold transition-colors"
            style={{
              background: form.ownershipStatus === s.value ? 'var(--accent)' : 'var(--elevated)',
              color: form.ownershipStatus === s.value ? '#fff' : 'var(--text-muted)',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Cover art */}
      {(() => {
        const igdbCovers = igdbData
          ? ([igdbData.coverUrl, ...igdbData.artworkUrls].filter(Boolean) as string[])
          : []
        const showStrip = igdbCovers.length > 0 || true // always show for upload
        const previewUrl = form.coverArtUrl ?? igdbCovers[0] ?? null

        return (
          <div>
            {previewUrl && (
              <div className="flex gap-4 items-start mb-3">
                <img
                  src={previewUrl}
                  alt={form.title}
                  className="w-16 rounded-lg object-cover aspect-[3/4] shrink-0"
                />
                {igdbData && (
                  <div>
                    <p className="text-xs text-text-muted">From IGDB</p>
                    <p className="font-semibold text-sm">{igdbData.title}</p>
                    {igdbData.releaseYear && <p className="text-xs text-text-muted">{igdbData.releaseYear}</p>}
                  </div>
                )}
              </div>
            )}
            {showStrip && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {igdbCovers.map(url => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => set('coverArtUrl', url)}
                    className="shrink-0 rounded-lg overflow-hidden transition-opacity"
                    style={{
                      width: '48px',
                      aspectRatio: '3/4',
                      outline: form.coverArtUrl === url ? '2px solid var(--accent)' : '2px solid transparent',
                      outlineOffset: '2px',
                      opacity: form.coverArtUrl === url ? 1 : 0.5,
                    }}
                  >
                    <img
                      src={url.replace('t_cover_big', 't_thumb')}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {/* Upload tile */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="shrink-0 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                  style={{
                    width: '48px',
                    aspectRatio: '3/4',
                    border: '1.5px dashed var(--border-bright)',
                    background: 'var(--elevated)',
                    color: 'var(--text-muted)',
                  }}
                  title="Upload custom image"
                >
                  <Upload size={14} className={uploading ? 'animate-pulse' : ''} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            )}
          </div>
        )
      })()}

      {/* Title */}
      <div>
        <label className="block text-xs text-text-muted mb-1.5 tracking-wide uppercase">Title *</label>
        <input className="input" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Game title" />
      </div>

      {/* Platform + Language */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-muted mb-1.5 tracking-wide uppercase">Platform *</label>
          <Combobox
            value={form.platform}
            onChange={v => {
              set('platform', v)
              if (PLATFORM_LANGUAGE[v]) set('language', PLATFORM_LANGUAGE[v])
            }}
            options={PLATFORMS}
            placeholder="NES, PS2…"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1.5 tracking-wide uppercase">Language *</label>
          <Combobox
            value={form.language}
            onChange={v => set('language', v)}
            options={LANGUAGES}
            placeholder="English"
            required
          />
        </div>
      </div>

      {/* Condition (owned only) */}
      {isOwned && (
      <div>
        <label className="block text-xs text-text-muted mb-1.5 tracking-wide uppercase">Condition</label>
        <select className="input" value={form.condition ?? ''} onChange={e => set('condition', (e.target.value || null) as CreateGameInput['condition'])}>
          <option value="">— Select —</option>
          {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      )}

      {/* Completion status (owned or digital) */}
      {(isOwned || isDigital) && (
        <div>
          <label className="block text-xs text-text-muted mb-1.5 tracking-wide uppercase">Status</label>
          <div className="grid grid-cols-3 gap-2">
            {COMPLETION_STATUSES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => set('completionStatus', s.value)}
                className="py-2 px-3 rounded-lg text-sm font-medium text-left transition-colors"
                style={{
                  background: form.completionStatus === s.value ? 'var(--elevated)' : 'transparent',
                  border: `1px solid ${form.completionStatus === s.value ? 'var(--border-bright)' : 'var(--border)'}`,
                  color: form.completionStatus === s.value ? 'var(--text)' : 'var(--text-muted)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time to beat */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-text-muted tracking-wide uppercase">Time to Beat</label>
          <button
            type="button"
            onClick={fetchHltb}
            disabled={hltbLoading || !form.title}
            className="flex items-center gap-1 text-xs text-accent disabled:opacity-40"
          >
            <RefreshCw size={12} className={hltbLoading ? 'animate-spin' : ''} />
            {hltbLoading ? 'Fetching…' : 'Fetch from HLTB'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { key: 'hltbMainStory' as const, label: 'Main' },
            { key: 'hltbExtras' as const, label: 'Extras' },
            { key: 'hltbCompletionist' as const, label: '100%' },
          ].map(({ key, label }) => (
            <div key={key} className="rounded-lg p-2" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-center gap-1 text-accent mb-1">
                <Clock size={12} />
                <span className="text-[10px] uppercase tracking-wide">{label}</span>
              </div>
              <p className="font-display text-lg">{formatMinutes(form[key])}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Owned: purchase fields */}
      {isOwned && (
        <div className="space-y-3">
          <label className="block text-xs text-text-muted tracking-wide uppercase">Purchase Details (optional)</label>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" type="number" min="0" step="0.01" placeholder="Price paid" value={form.purchasePrice ?? ''} onChange={e => set('purchasePrice', e.target.value ? Number(e.target.value) : null)} />
            <input className="input" type="date" value={form.purchaseDate ?? ''} onChange={e => set('purchaseDate', e.target.value || null)} />
          </div>
          <input className="input" placeholder="Purchased from (eBay, local store…)" value={form.purchaseLocation ?? ''} onChange={e => set('purchaseLocation', e.target.value || null)} />
        </div>
      )}

      {/* Wishlist: target price */}
      {isWishlist && (
        <div>
          <label className="block text-xs text-text-muted mb-1.5 tracking-wide uppercase">Target Price (optional)</label>
          <input className="input" type="number" min="0" step="0.01" placeholder="Max you'd pay" value={form.targetPrice ?? ''} onChange={e => set('targetPrice', e.target.value ? Number(e.target.value) : null)} />
        </div>
      )}

      {/* Playthrough tracking (owned or digital) */}
      {(isOwned || isDigital) && (
        <div className="space-y-3">
          <label className="block text-xs text-text-muted tracking-wide uppercase">My Playthrough (optional)</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-text-muted mb-1 tracking-wide uppercase">Date Completed</label>
              <input
                className="input"
                type="date"
                value={form.completionDate ?? ''}
                onChange={e => set('completionDate', e.target.value || null)}
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-muted mb-1 tracking-wide uppercase">Hours Played</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 12.5"
                value={form.personalPlaytime != null ? form.personalPlaytime / 60 : ''}
                onChange={e => set('personalPlaytime', e.target.value ? Math.round(Number(e.target.value) * 60) : null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block text-xs text-text-muted mb-1.5 tracking-wide uppercase">Personal Rating (1–10)</label>
        <input className="input" type="number" min="1" max="10" placeholder="—" value={form.personalRating ?? ''} onChange={e => set('personalRating', e.target.value ? Number(e.target.value) : null)} />
      </div>


      {/* Notes */}
      <div>
        <label className="block text-xs text-text-muted mb-1.5 tracking-wide uppercase">Notes</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Any thoughts…"
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value || null)}
        />
      </div>

      {error && <p className="text-red text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn btn-ghost flex-1" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
