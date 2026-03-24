import type { Game, CreateGameInput, UpdateGameInput } from '@backlogged/types'
import { apiFetch } from './client'

export interface ListGamesParams {
  search?: string
  ownershipStatus?: string
  platform?: string
  language?: string
  completionStatus?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export const gamesApi = {
  list: (params: ListGamesParams = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v) as [string, string][],
    ).toString()
    return apiFetch<Game[]>(`/games${qs ? `?${qs}` : ''}`)
  },

  get: (id: number) => apiFetch<Game>(`/games/${id}`),

  create: (input: CreateGameInput) =>
    apiFetch<Game>('/games', { method: 'POST', body: JSON.stringify(input) }),

  update: (id: number, input: UpdateGameInput) =>
    apiFetch<Game>(`/games/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),

  delete: (id: number) => apiFetch<void>(`/games/${id}`, { method: 'DELETE' }),

  reorderBacklog: (ids: number[]) =>
    apiFetch<void>('/games/backlog/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),

  import: (mode: 'add' | 'replace', games: Game[]) =>
    apiFetch<void>('/games/import', {
      method: 'POST',
      body: JSON.stringify({ mode, games }),
    }),
}
