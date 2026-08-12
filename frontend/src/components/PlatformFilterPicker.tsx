import { PLATFORMS } from '../lib/constants'

export const PLATFORM_GROUPS: { label: string; platforms: string[] }[] = [
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

/** A platform filter is only meaningful when some (but not all) platforms are selected — an empty or full selection both mean "no filter". */
export function isPlatformFilterActive(selected: string[]): boolean {
  return selected.length > 0 && selected.length < PLATFORMS.length
}

interface Props {
  selected: string[]
  onChange: (platforms: string[]) => void
}

export default function PlatformFilterPicker({ selected, onChange }: Props) {
  const enabled = new Set(selected)

  const toggle = (platform: string) => {
    const next = new Set(enabled)
    if (next.has(platform)) next.delete(platform)
    else next.add(platform)
    onChange([...next])
  }

  const selectAll = () => onChange([...PLATFORMS])
  const clearAll = () => onChange([])

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <p className="text-xs" style={{ color: isPlatformFilterActive(selected) ? 'var(--accent)' : 'var(--text-muted)' }}>
          {enabled.size === 0 || enabled.size === PLATFORMS.length
            ? 'All platforms'
            : `${enabled.size} ${enabled.size === 1 ? 'platform' : 'platforms'} selected`}
        </p>
        <div className="flex gap-3 shrink-0">
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

      <div className="space-y-4">
        {PLATFORM_GROUPS.map(group => (
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
    </div>
  )
}
