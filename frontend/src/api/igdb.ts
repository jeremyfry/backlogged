import type { IgdbSearchResult } from '@backlogged/types'
import { apiFetch } from './client'

export const igdbApi = {
  search: (q: string, options: { beforeYear?: number } = {}) => {
    const params = new URLSearchParams({ q })
    if (options.beforeYear != null) params.set('beforeYear', String(options.beforeYear))
    return apiFetch<IgdbSearchResult[]>(`/igdb/search?${params}`)
  },

  getById: (id: number) => apiFetch<IgdbSearchResult>(`/igdb/games/${id}`),
}
