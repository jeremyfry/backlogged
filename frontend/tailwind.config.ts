import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['Outfit', 'sans-serif'],
      },
      colors: {
        bg:       'var(--bg)',
        surface:  'var(--surface)',
        elevated: 'var(--elevated)',
        card:     'var(--card)',
        border: {
          DEFAULT: 'var(--border)',
          bright:  'var(--border-bright)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted:   'var(--text-muted)',
          dim:     'var(--text-dim)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          dim:     'var(--accent-dim)',
          glow:    'var(--accent-glow)',
        },
        green:  'var(--green)',
        red:    'var(--red)',
        blue:   'var(--blue)',
        yellow: 'var(--yellow)',
      },
    },
  },
  plugins: [],
} satisfies Config
