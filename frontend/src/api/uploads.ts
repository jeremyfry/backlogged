import { ApiError, getToken } from './client'

export const uploadsApi = {
  upload: async (file: File): Promise<string> => {
    const token = getToken()
    const body = new FormData()
    body.append('image', file)
    const res = await fetch('/api/uploads', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: 'Upload failed' }))
      throw new ApiError(res.status, (data as { message?: string }).message ?? 'Upload failed')
    }
    const { url } = await res.json() as { url: string }
    return url
  },
}
