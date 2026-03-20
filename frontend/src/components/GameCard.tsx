import type { Game } from '@backlogged/types'
import { STATUS_COLORS, STATUS_LABELS } from '../lib/constants'
import PlatformLogo, { hasPlatformLogo } from './PlatformLogo'

interface Props {
  game: Game
  onClick?: () => void
}

export default function GameCard({ game, onClick }: Props) {
  const statusColor = STATUS_COLORS[game.completionStatus] ?? 'var(--border)'
  const statusLabel = STATUS_LABELS[game.completionStatus] ?? ''
  const isJapanese = game.language === 'Japanese'

  return (
    <div className="game-card flex flex-col" onClick={onClick} role="button" tabIndex={0}
         onKeyDown={e => e.key === 'Enter' && onClick?.()}>

      {/* Cover art */}
      <div className="relative aspect-[2/3] w-full flex-shrink-0">
        {game.coverArtUrl ? (
          <img
            src={game.coverArtUrl}
            alt={game.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-3"
               style={{ background: 'var(--elevated)' }}>
            <span className="font-display text-2xl text-center leading-tight"
                  style={{ color: 'var(--text-dim)' }}>
              {game.title}
            </span>
          </div>
        )}

        {/* Language badge */}
        {isJapanese && (
          <div className="absolute top-1.5 left-1.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(249,115,22,0.85)', color: '#fff',
                           backdropFilter: 'blur(4px)' }}>
              JP
            </span>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="flex flex-col gap-2 px-2.5 pt-2.5 pb-2.5"
           style={{ background: 'var(--elevated)', borderTop: '1px solid var(--border)' }}>
        {/* Title — always exactly 2 lines tall */}
        <p className="text-xs font-semibold leading-tight line-clamp-2"
           style={{ color: 'var(--text)', minHeight: 'calc(2 * 1.25 * 0.75rem)' }}>
          {game.title}
        </p>
        {/* Platform logo */}
        <div style={{ color: 'var(--text-muted)' }}>
          {hasPlatformLogo(game.platform)
            ? <PlatformLogo platform={game.platform} size={18} />
            : <span className="text-[11px] font-medium">{game.platform}</span>
          }
        </div>
        {/* Status */}
        <span className="text-[11px] font-semibold"
              style={{ color: statusColor }}>
          {statusLabel}
        </span>
      </div>

      {/* Status accent bar */}
      <div className="h-[3px] flex-shrink-0" style={{ background: statusColor }} />
    </div>
  )
}
