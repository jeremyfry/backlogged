// Map each platform name to the ASCII character that renders its logo
// in the Game Logos font. Fill in the right-hand string as you identify
// each glyph from the font specimen.
const PLATFORM_CHARS: Record<string, string> = {
  'NES':                '',
  'Famicom':            '',
  'SNES':               '',
  'Super Famicom':      '',
  'Nintendo 64':        '',
  'GameCube':           '',
  'Wii':                '',
  'Wii U':              '',
  'Nintendo Switch':    '',
  'Game Boy':           '',
  'Game Boy Color':     '',
  'Game Boy Advance':   '',
  'Nintendo DS':        '',
  'Nintendo 3DS':       '',
  'PlayStation':        '',
  'PlayStation 2':      '',
  'PlayStation 3':      '',
  'PlayStation 4':      '',
  'PlayStation 5':      '',
  'PSP':                '',
  'PlayStation Vita':   '',
  'Xbox':               '',
  'Xbox 360':           '',
  'Xbox One':           '',
  'Xbox Series X/S':    '',
  'PC':                 '',
  'Sega Genesis':       '',
  'Sega Mega Drive':    '',
  'Sega Saturn':        '',
  'Sega Dreamcast':     '',
  'Game Gear':          '',
  'Other':              '',
}

interface PlatformLogoProps {
  platform: string
  size?: number
  className?: string
}

export default function PlatformLogo({ platform, size = 20, className }: PlatformLogoProps) {
  const char = PLATFORM_CHARS[platform]
  if (!char) return null
  return (
    <span
      className={`font-gamelogos ${className ?? ''}`}
      style={{ fontSize: size, lineHeight: 1, display: 'inline-block' }}
      aria-label={platform}
    >
      {char}
    </span>
  )
}

export function hasPlatformLogo(platform: string): boolean {
  return !!(PLATFORM_CHARS[platform])
}
