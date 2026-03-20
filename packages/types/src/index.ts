export type OwnershipStatus = 'owned' | 'wishlist'

export type Condition =
  | 'wanted'
  | 'sealed'
  | 'complete_in_box'
  | 'loose'
  | 'incomplete'

export type CompletionStatus =
  | 'unplayed'
  | 'up_next'
  | 'in_progress'
  | 'completed'
  | 'dropped'

export interface Game {
  id: number
  title: string
  platform: string
  language: string
  genre: string | null
  developer: string | null
  publisher: string | null
  releaseYear: number | null
  coverArtUrl: string | null
  igdbId: number | null
  personalRating: number | null
  completionStatus: CompletionStatus
  /** Minutes */
  hltbMainStory: number | null
  /** Minutes */
  hltbExtras: number | null
  /** Minutes */
  hltbCompletionist: number | null
  notes: string | null
  completionDate: string | null
  /** Minutes */
  personalPlaytime: number | null
  ownershipStatus: OwnershipStatus
  condition: Condition | null
  purchasePrice: number | null
  purchaseDate: string | null
  purchaseLocation: string | null
  targetPrice: number | null
  backlogPosition: number | null
  createdAt: string
  updatedAt: string
}

export type CreateGameInput = {
  // Required
  title: string
  platform: string
  language: string
  ownershipStatus: OwnershipStatus
  completionStatus: CompletionStatus
  // Optional
  genre?: string | null
  developer?: string | null
  publisher?: string | null
  releaseYear?: number | null
  coverArtUrl?: string | null
  igdbId?: number | null
  personalRating?: number | null
  hltbMainStory?: number | null
  hltbExtras?: number | null
  hltbCompletionist?: number | null
  notes?: string | null
  completionDate?: string | null
  personalPlaytime?: number | null
  condition?: Condition | null
  purchasePrice?: number | null
  purchaseDate?: string | null
  purchaseLocation?: string | null
  targetPrice?: number | null
  backlogPosition?: number | null
}

export type UpdateGameInput = Partial<CreateGameInput>

export interface HltbResult {
  hltbId: number
  title: string
  /** Minutes, null if not available */
  mainStory: number | null
  /** Minutes, null if not available */
  mainExtra: number | null
  /** Minutes, null if not available */
  completionist: number | null
}

export interface IgdbSearchResult {
  igdbId: number
  title: string
  coverUrl: string | null
  releaseYear: number | null
  platforms: string[]
  genres: string[]
  developer: string | null
  publisher: string | null
  summary: string | null
}

export interface ApiError {
  error: string
  message: string
}

export interface AuthResponse {
  token: string
}

export interface AuthStatusResponse {
  configured: boolean
}

export interface HealthResponse {
  status: 'ok'
}
