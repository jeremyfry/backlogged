import type { HltbResult } from '@backlogged/types'
import { apiFetch } from './client'

export const hltbApi = {
  search: (q: string) =>
    apiFetch<HltbResult[]>(`/hltb/search?${new URLSearchParams({ q })}`),
}
