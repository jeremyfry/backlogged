import { useState, useRef } from 'react'
import { Download, Upload } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import type { AppSettings, Condition, Game } from '@backlogged/types'
import { PLATFORMS, CONDITIONS } from '../lib/constants'
import { gamesApi } from '../api/games'
import { useQueryClient } from '@tanstack/react-query'

const GROUPS: { label: string; platforms: string[] }[] = [
  {
    label: 'Nintendo',
    platforms: ['NES', 'Famicom', 'SNES', 'Super Famicom', 'Nintendo 64', 'GameCube', 'Wii', 'Wii U', 'Nintendo Switch'],
  },
  {
    label: 'Nintendo Handheld',
    platforms: ['Game Boy', 'Game Boy Color', 'Game Boy Advance', 'Nintendo DS', 'Nintendo 3DS'],
  },
  {
    label: 'PlayStation',
    platforms: ['PlayStation', 'PlayStation 2', 'PlayStation 3', 'PlayStation 4', 'PlayStation 5', 'PSP', 'PlayStation Vita'],
  },
  {
    label: 'Sega',
    platforms: ['Sega Genesis', 'Sega Mega Drive', 'Sega Saturn', 'Sega Dreamcast', 'Game Gear'],
  },
  {
    label: 'Xbox',
    platforms: ['Xbox', 'Xbox 360', 'Xbox One', 'Xbox Series X/S'],
  },
  {
    label: 'Other',
    platforms: PLATFORMS.filter(p =>
      !['NES','Famicom','SNES','Super Famicom','Nintendo 64','GameCube','Wii','Wii U','Nintendo Switch',
        'Game Boy','Game Boy Color','Game Boy Advance','Nintendo DS','Nintendo 3DS',
        'PlayStation','PlayStation 2','PlayStation 3','PlayStation 4','PlayStation 5','PSP','PlayStation Vita',
        'Sega Genesis','Sega Mega Drive','Sega Saturn','Sega Dreamcast','Game Gear',
        'Xbox','Xbox 360','Xbox One','Xbox Series X/S',
      ].includes(p)
    ),
  },
]

export default function Settings() {
  const { settings, update } = useSettings()
  const enabled = new Set(settings.igdbPlatforms)
  const queryClient = useQueryClient()

  const [exporting, setExporting] = useState(false)
  const [importMode, setImportMode] = useState<'add' | 'replace'>('add')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')
  const importFileRef = useRef<HTMLInputElement>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    setImportSuccess('')
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as Game[]
      if (!Array.isArray(data)) throw new Error('Invalid file: expected an array of games')
      await gamesApi.import(importMode, data)
      await queryClient.invalidateQueries({ queryKey: ['games'] })
      setImportSuccess(`${data.length} game${data.length !== 1 ? 's' : ''} imported.`)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const games = await gamesApi.list()
      const data = games.map(g => ({
        ...g,
        coverArtUrl: g.coverArtUrl?.startsWith('/uploads/') ? null : g.coverArtUrl,
      }))
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backlogged-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const save = (igdbPlatforms: string[]) => update({ igdbPlatforms } as Partial<AppSettings>)

  const toggle = (platform: string) => {
    const next = new Set(enabled)
    if (next.has(platform)) next.delete(platform)
    else next.add(platform)
    save([...next])
  }

  const selectAll = () => save([...PLATFORMS])
  const clearAll  = () => save([])

  return (
    <div className="px-4 py-5 space-y-8">

      {/* Export */}
      <section>
        <h2 className="font-display text-xl mb-1">Export Data</h2>
        <p className="text-xs text-text-muted mb-4">
          Download your full library as JSON. Custom uploaded cover images are not included.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="btn btn-ghost flex items-center gap-2 disabled:opacity-50"
        >
          <Download size={15} />
          {exporting ? 'Exporting…' : 'Export JSON'}
        </button>
      </section>

      {/* Import */}
      <section>
        <h2 className="font-display text-xl mb-1">Import Data</h2>
        <p className="text-xs text-text-muted mb-4">
          Import a previously exported JSON file.
        </p>
        <div className="flex rounded-lg overflow-hidden border mb-4" style={{ borderColor: 'var(--border)', width: 'fit-content' }}>
          {(['add', 'replace'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setImportMode(m); setImportError(''); setImportSuccess('') }}
              className="px-4 py-2 text-sm font-semibold transition-colors capitalize"
              style={{
                background: importMode === m ? 'var(--accent)' : 'var(--elevated)',
                color: importMode === m ? '#fff' : 'var(--text-muted)',
              }}
            >
              {m}
            </button>
          ))}
        </div>
        {importMode === 'replace' && (
          <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--red)', border: '1px solid rgba(244,63,94,0.3)' }}>
            Replace will delete your entire library before importing. This cannot be undone.
          </p>
        )}
        {importMode === 'add' && (
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Add will append imported games to your existing library.
          </p>
        )}
        <button
          type="button"
          onClick={() => importFileRef.current?.click()}
          disabled={importing}
          className="btn btn-ghost flex items-center gap-2 disabled:opacity-50"
        >
          <Upload size={15} />
          {importing ? 'Importing…' : 'Choose File'}
        </button>
        <input ref={importFileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
        {importError && <p className="text-xs mt-3" style={{ color: 'var(--red)' }}>{importError}</p>}
        {importSuccess && <p className="text-xs mt-3" style={{ color: 'var(--accent)' }}>{importSuccess}</p>}
      </section>

      {/* Default Condition */}
      <section>
        <h2 className="font-display text-xl mb-1">Default Condition</h2>
        <p className="text-xs text-text-muted mb-4">
          Automatically pre-fill the condition field when adding a new owned game.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => update({ defaultCondition: null } as Partial<AppSettings>)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: settings.defaultCondition === null ? 'var(--accent)' : 'var(--elevated)',
              color: settings.defaultCondition === null ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${settings.defaultCondition === null ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            None
          </button>
          {CONDITIONS.filter(c => c.value !== 'wanted').map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => update({ defaultCondition: c.value as Condition } as Partial<AppSettings>)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: settings.defaultCondition === c.value ? 'var(--accent)' : 'var(--elevated)',
                color: settings.defaultCondition === c.value ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${settings.defaultCondition === c.value ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* IGDB Platform Filter */}
      <section>
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-xl">IGDB Platform Filter</h2>
          <div className="flex gap-3 shrink-0 ml-4">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-text-muted hover:text-accent transition-colors"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-text-muted hover:text-accent transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        <p className="text-xs text-text-muted mb-5">
          Limit IGDB search results to games available on your selected systems.
          Leave all unchecked to show results for every platform.
        </p>

        {enabled.size > 0 && (
          <p className="text-xs mb-4" style={{ color: 'var(--accent)' }}>
            {enabled.size} {enabled.size === 1 ? 'platform' : 'platforms'} selected
          </p>
        )}

        <div className="space-y-5">
          {GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[10px] tracking-widest uppercase text-text-muted mb-2 px-0.5">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.platforms.map(platform => {
                  const active = enabled.has(platform)
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => toggle(platform)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        background: active ? 'var(--accent)' : 'var(--elevated)',
                        color: active ? '#fff' : 'var(--text-muted)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      }}
                    >
                      {platform}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
