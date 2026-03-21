import { Condition } from "@backlogged/types"

/** Map IGDB platform names → our preferred short names */
export const IGDB_PLATFORM_MAP: Record<string, string> = {
  // Nintendo
  'Nintendo Entertainment System':           'NES',
  'Family Computer':                         'Famicom',
  'Super Nintendo Entertainment System':     'SNES',
  'Super Famicom':                           'Super Famicom',
  'Nintendo 64':                             'Nintendo 64',
  'GameCube':                                'GameCube',
  'Wii':                                     'Wii',
  'Wii U':                                   'Wii U',
  'Nintendo Switch':                         'Nintendo Switch',
  'Game Boy':                                'Game Boy',
  'Game Boy Color':                          'Game Boy Color',
  'Game Boy Advance':                        'Game Boy Advance',
  'Nintendo DS':                             'Nintendo DS',
  'Nintendo 3DS':                            'Nintendo 3DS',
  // PlayStation
  'PlayStation':                             'PlayStation',
  'PlayStation 2':                           'PlayStation 2',
  'PlayStation 3':                           'PlayStation 3',
  'PlayStation 4':                           'PlayStation 4',
  'PlayStation 5':                           'PlayStation 5',
  'PlayStation Portable':                    'PSP',
  'PlayStation Vita':                        'PlayStation Vita',
  // Sega
  'Sega Mega Drive/Genesis':                 'Sega Genesis',
  'Sega Mega Drive':                         'Sega Mega Drive',
  'Sega Genesis':                            'Sega Genesis',
  'Sega Saturn':                             'Sega Saturn',
  'Dreamcast':                               'Sega Dreamcast',
  'Game Gear':                               'Game Gear',
  // Xbox
  'Xbox':                                    'Xbox',
  'Xbox 360':                                'Xbox 360',
  'Xbox One':                                'Xbox One',
  'Xbox Series X|S':                         'Xbox Series X/S',
  'Xbox Series X':                           'Xbox Series X/S',
  // PC
  'PC (Microsoft Windows)':                  'PC',
  'PC':                                      'PC',
  'Mac':                                     'PC',
  'Linux':                                   'PC',
}

export function normalizeIgdbPlatform(igdbName: string): string {
  return IGDB_PLATFORM_MAP[igdbName] ?? igdbName
}

export const PLATFORMS = [
  'NES', 'Famicom', 'SNES', 'Super Famicom', 'Nintendo 64', 'GameCube',
  'Wii', 'Wii U', 'Nintendo Switch', 'Game Boy', 'Game Boy Color',
  'Game Boy Advance', 'Nintendo DS', 'Nintendo 3DS',
  'PlayStation', 'PlayStation 2', 'PlayStation 3', 'PlayStation 4', 'PlayStation 5',
  'PSP', 'PlayStation Vita',
  'Sega Genesis', 'Sega Mega Drive', 'Sega Saturn', 'Sega Dreamcast', 'Game Gear',
  'Xbox', 'Xbox 360', 'Xbox One', 'Xbox Series X/S',
  'PC', 'Other',
]

export const LANGUAGES = [
  'English', 'Japanese', 'French', 'German', 'Spanish', 'Italian',
  'Korean', 'Chinese (Simplified)', 'Chinese (Traditional)', 'Portuguese', 'Other',
]

export const CONDITIONS = [
  { value: 'wanted',        label: 'Wanted (Any)' },
  { value: 'sealed',        label: 'Sealed' },
  { value: 'complete_in_box', label: 'Complete In Box' },
  { value: 'loose',         label: 'Loose' },
  { value: 'incomplete',    label: 'Incomplete' },
] as const

export const COMPLETION_STATUSES = [
  { value: 'unplayed',    label: 'Unplayed' },
  { value: 'up_next',     label: 'Up Next' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'dropped',     label: 'Dropped' },
] as const

export const STATUS_COLORS: Record<string, string> = {
  unplayed:    'transparent',
  up_next:     '#60a5fa',
  in_progress: 'var(--accent)',
  completed:   'var(--green)',
  dropped:     'var(--red)',
}

export const STATUS_LABELS: Record<string, string> = {
  unplayed:    'Unplayed',
  up_next:     'Up Next',
  in_progress: 'In Progress',
  completed:   'Completed',
  dropped:     'Dropped',
}
