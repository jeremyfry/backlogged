import { useSettings } from '../hooks/useSettings'
import type { AppSettings, Condition } from '@backlogged/types'
import { PLATFORMS, CONDITIONS } from '../lib/constants'

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
