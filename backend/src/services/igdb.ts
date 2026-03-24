import type { IgdbSearchResult } from '@backlogged/types'

// --- Token cache ---

interface TokenCache {
  value: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

export function clearTokenCache(): void {
  tokenCache = null
}

async function getAccessToken(fetchFn = globalThis.fetch): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 5 * 60 * 1000) {
    return tokenCache.value
  }

  const clientId = process.env.IGDB_CLIENT_ID
  const clientSecret = process.env.IGDB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  })

  const res = await fetchFn(`https://id.twitch.tv/oauth2/token?${params.toString()}`, {
    method: 'POST',
  })

  if (!res.ok) {
    throw new Error(`Failed to get Twitch token: ${res.status}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return tokenCache.value
}

// --- IGDB request ---

async function igdbRequest(
  endpoint: string,
  body: string,
  fetchFn = globalThis.fetch,
): Promise<unknown> {
  const token = await getAccessToken(fetchFn)
  const clientId = process.env.IGDB_CLIENT_ID!

  const res = await fetchFn(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body,
  })

  if (!res.ok) {
    throw new Error(`IGDB API error: ${res.status}`)
  }

  return res.json()
}

// --- Cover art ---

export function coverUrl(imageId: string, size = 'cover_big'): string {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`
}

// --- Raw IGDB types ---

interface RawIgdbGame {
  id: number
  name: string
  cover?: { image_id: string }
  artworks?: { image_id: string }[]
  first_release_date?: number // Unix timestamp (seconds)
  platforms?: { name: string }[]
  genres?: { name: string }[]
  involved_companies?: {
    developer: boolean
    publisher: boolean
    company: { name: string }
  }[]
  summary?: string
}

// --- Normalize ---

function normalize(raw: RawIgdbGame): IgdbSearchResult {
  return {
    igdbId: raw.id,
    title: raw.name,
    coverUrl: raw.cover ? coverUrl(raw.cover.image_id) : null,
    artworkUrls: raw.artworks?.map((a) => coverUrl(a.image_id, 'cover_big')) ?? [],
    releaseYear: raw.first_release_date
      ? new Date(raw.first_release_date * 1000).getFullYear()
      : null,
    platforms: raw.platforms?.map((p) => p.name) ?? [],
    genres: raw.genres?.map((g) => g.name) ?? [],
    developer: raw.involved_companies?.find((c) => c.developer)?.company.name ?? null,
    publisher: raw.involved_companies?.find((c) => c.publisher)?.company.name ?? null,
    summary: raw.summary ?? null,
  }
}

const GAME_FIELDS =
  'id,name,cover.image_id,artworks.image_id,first_release_date,platforms.name,genres.name,' +
  'involved_companies.company.name,involved_companies.developer,involved_companies.publisher,summary'

// --- Public API ---

export async function searchGames(
  query: string,
  options: { beforeYear?: number } = {},
  fetchFn = globalThis.fetch,
): Promise<IgdbSearchResult[]> {
  const escaped = query.replace(/"/g, '\\"')

  const whereClauses: string[] = []
  if (options.beforeYear != null) {
    const ts = Math.floor(new Date(options.beforeYear, 0, 1).getTime() / 1000)
    whereClauses.push(`first_release_date < ${ts}`)
    whereClauses.push('first_release_date != null')
  }

  const where = whereClauses.length > 0 ? ` where ${whereClauses.join(' & ')};` : ''
  const body = `search "${escaped}"; fields ${GAME_FIELDS};${where} limit 10;`
  const results = (await igdbRequest('games', body, fetchFn)) as RawIgdbGame[]
  return results
    .map(normalize)
    .sort((a, b) => (a.releaseYear ?? 9999) - (b.releaseYear ?? 9999))
}

export async function getIgdbGame(
  igdbId: number,
  fetchFn = globalThis.fetch,
): Promise<IgdbSearchResult | null> {
  const body = `fields ${GAME_FIELDS}; where id = ${igdbId};`
  const results = (await igdbRequest('games', body, fetchFn)) as RawIgdbGame[]
  return results.length > 0 ? normalize(results[0]) : null
}
