import { memo } from 'react'

// Seeded LCG — deterministic "random", no Math.random() at render time
function makeLcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

// Game controller buttons: PlayStation (△○✕□) + Xbox/Nintendo (A B X Y)
// Colors are intentionally muted — these live in the background
const BUTTONS = [
  { symbol: '△', color: '#4A9490' }, // PS Triangle — muted teal
  { symbol: '○', color: '#A85050' }, // PS Circle   — muted red
  { symbol: '✕', color: '#5878A8' }, // PS Cross    — muted blue
  { symbol: '□', color: '#A04888' }, // PS Square   — muted pink
  { symbol: 'A', color: '#4E8C4E' }, // Xbox A      — muted green
  { symbol: 'B', color: '#A04848' }, // Xbox B      — muted red
  { symbol: 'X', color: '#5878A8' }, // Xbox X      — muted blue
  { symbol: 'Y', color: '#9E8038' }, // Xbox Y      — muted yellow
]

interface FallParticle {
  type: 'fall'
  x: number        // 0–100 (% of viewport width)
  size: number     // px
  duration: number // seconds
  delay: number    // negative = start mid-cycle on load
  opacity: number
  orange: boolean
}

interface TwinkleParticle {
  type: 'twinkle'
  x: number  // 0–100 (% of viewport width)
  y: number  // 0–100 (% of viewport height)
  duration: number
  delay: number
  opacity: number
  symbol: string
  color: string
}

type Particle = FallParticle | TwinkleParticle

function generateParticles(): Particle[] {
  const r = makeLcg(0xbadc0de)
  const particles: Particle[] = []

  // 52 falling pixels — spread evenly across width with slight jitter
  for (let i = 0; i < 52; i++) {
    const baseX = (i / 52) * 100
    particles.push({
      type: 'fall',
      x: Math.max(0.5, Math.min(99.5, baseX + r() * 3 - 1.5)),
      size: r() > 0.65 ? 4 : 3,
      duration: 14 + r() * 18,  // 14–32s, slow and meditative
      delay: -(r() * 28),       // start randomly mid-cycle so screen isn't empty
      opacity: 0.15 + r() * 0.2,
      orange: r() > 0.78,
    })
  }

  // 12 twinkling button symbols at scattered fixed positions
  const xSlots = [4, 11, 20, 29, 38, 47, 54, 62, 71, 80, 88, 95]
  for (let i = 0; i < 12; i++) {
    const btn = BUTTONS[i % BUTTONS.length]
    particles.push({
      type: 'twinkle',
      x: xSlots[i] + r() * 4 - 2,
      y: 8 + r() * 84,
      duration: 4 + r() * 8,
      delay: -(r() * 10),
      opacity: 0.25 + r() * 0.2,
      symbol: btn.symbol,
      color: btn.color,
    })
  }

  return particles
}

const PARTICLES = generateParticles()

const RetroBackground = memo(function RetroBackground() {
  return (
    <svg
      aria-hidden
      focusable="false"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {PARTICLES.map((p, i) => {
        const base: React.CSSProperties = {
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          animationIterationCount: 'infinite',
          ['--px-op' as string]: p.opacity,
        }

        if (p.type === 'fall') {
          const fill = p.orange ? '#B06020' : '#7878A0'
          return (
            <rect
              key={i}
              x={`${p.x}%`}
              y={-p.size * 2}
              width={p.size}
              height={p.size}
              fill={fill}
              style={{
                ...base,
                animationName: 'pixel-fall',
                animationTimingFunction: 'linear',
              }}
            />
          )
        }

        // Twinkle: controller button — circle ring + symbol, positioned via vw/vh
        return (
          <g
            key={i}
            style={{
              ...base,
              transform: `translate(${p.x}vw, ${p.y}vh)`,
              animationName: 'pixel-twinkle',
              animationTimingFunction: 'ease-in-out',
            }}
          >
            <circle cx={0} cy={0} r={11} fill="none" stroke={p.color} strokeWidth={1.5} />
            <text
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="central"
              fill={p.color}
              style={{ fontSize: '12px', fontFamily: 'monospace', userSelect: 'none' }}
            >
              {p.symbol}
            </text>
          </g>
        )
      })}
    </svg>
  )
})

export default RetroBackground
