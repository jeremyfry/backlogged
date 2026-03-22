import type { AppSettings } from '@backlogged/types'
import { apiFetch } from './client'

export const settingsApi = {
  get: () => apiFetch<AppSettings>('/settings'),
  patch: (patch: Partial<AppSettings>) =>
    apiFetch<AppSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
}
