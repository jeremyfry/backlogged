import type { IgdbSearchResult } from '@backlogged/types'
import { apiFetch } from './client'

export const igdbApi = {
  search: (q: string) =>
    apiFetch<IgdbSearchResult[]>(`/igdb/search?${new URLSearchParams({ q })}`),

  getById: (id: number) => apiFetch<IgdbSearchResult>(`/igdb/games/${id}`),
}
