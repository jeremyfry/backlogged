import type { Game } from '@backlogged/types'
import { STATUS_COLORS, STATUS_LABELS, CONDITIONS } from '../lib/constants'
import PlatformLogo, { hasPlatformLogo } from './PlatformLogo'

interface Props {
  game: Game
  onClick?: () => void
}

export default function GameCard({ game, onClick }: Props) {
  const isWishlist = game.ownershipStatus === 'wishlist'
  const statusColor = STATUS_COLORS[game.completionStatus] ?? 'var(--border)'
  const label = isWishlist
    ? (CONDITIONS.find(c => c.value === game.condition)?.label ?? '')
    : (STATUS_LABELS[game.completionStatus] ?? '')
  const labelColor = isWishlist ? 'var(--accent)' : statusColor
  const isJapanese = game.language === 'Japanese'

  return (
    <div className="game-card flex flex-col" onClick={onClick} role="button" tabIndex={0}
         onKeyDown={e => e.key === 'Enter' && onClick?.()}>

      {/* Cover art */}
      <div className="relative w-full flex-shrink-0" style={{ aspectRatio: '2.3/3' }}>
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
      <div className="flex flex-col px-2.5 pt-2.5"
           style={{ background: 'var(--elevated)', borderTop: '1px solid var(--border)' }}>
        {/* Title */}
        <p className="text-xs font-semibold leading-tight truncate mb-1" style={{ color: 'var(--text)' }}>
          {game.title}
        </p>
        {/* Platform logo */}
        <div style={{ color: 'var(--text-muted)' }}>
          {hasPlatformLogo(game.platform)
            ? <PlatformLogo platform={game.platform} size={18} />
            : <span className="text-[11px] font-medium">{game.platform}</span>
          }
        </div>
        {/* Status / Condition */}
        <span className="text-[11px] font-semibold mt-1" style={{ color: labelColor }}>
          {label}
        </span>
      </div>

      {/* Status accent bar */}
      <div className="h-[3px] flex-shrink-0" style={{ background: labelColor }} />
    </div>
  )
}
