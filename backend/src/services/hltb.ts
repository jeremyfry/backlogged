import type { HltbResult } from '@backlogged/types'

const BASE_URL = 'https://howlongtobeat.com'
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface HltbGame {
  game_id: number
  game_name: string
  comp_main: number  // seconds
  comp_plus: number  // seconds
  comp_100: number   // seconds
}

interface HltbResponse {
  data: HltbGame[]
}

/** Cache the auth token for 10 minutes */
let tokenCache: { value: string; expiresAt: number } | null = null

async function getToken(fetchFn = globalThis.fetch): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.value
  }
  const res = await fetchFn(`${BASE_URL}/api/finder/init?t=${Date.now()}`, {
    headers: { 'User-Agent': USER_AGENT, Referer: BASE_URL },
  })
  if (!res.ok) throw new Error(`HLTB token request failed: ${res.status}`)
  const data = (await res.json()) as { token: string }
  tokenCache = { value: data.token, expiresAt: Date.now() + 10 * 60 * 1000 }
  return data.token
}

function secondsToMinutes(seconds: number): number | null {
  return seconds > 0 ? Math.round(seconds / 60) : null
}

function normalize(game: HltbGame): HltbResult {
  return {
    hltbId: game.game_id,
    title: game.game_name,
    mainStory: secondsToMinutes(game.comp_main),
    mainExtra: secondsToMinutes(game.comp_plus),
    completionist: secondsToMinutes(game.comp_100),
  }
}

export async function searchHltb(
  query: string,
  fetchFn = globalThis.fetch,
): Promise<HltbResult[]> {
  const token = await getToken(fetchFn)

  const body = {
    searchType: 'games',
    searchTerms: query.trim().split(/\s+/),
    searchPage: 1,
    size: 10,
    searchOptions: {
      games: {
        userId: 0,
        platform: '',
        sortCategory: 'popular',
        rangeCategory: 'main',
        rangeTime: { min: null, max: null },
        gameplay: { perspective: '', flow: '', genre: '', difficulty: '' },
        rangeYear: { min: null, max: null },
        modifier: '',
      },
      users: { sortCategory: 'postcount' },
      lists: { sortCategory: 'follows' },
      filter: '',
      sort: 0,
      randomizer: 0,
    },
    useCache: true,
  }

  const res = await fetchFn(`${BASE_URL}/api/finder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      Referer: `${BASE_URL}/`,
      'x-auth-token': token,
    },
    body: JSON.stringify(body),
  })

  if (res.status === 403) {
    // Token expired — clear cache and retry once
    tokenCache = null
    return searchHltb(query, fetchFn)
  }

  if (!res.ok) throw new Error(`HLTB search failed: ${res.status}`)

  const data = (await res.json()) as HltbResponse
  return (data.data ?? []).map(normalize)
}

export function clearTokenCache(): void {
  tokenCache = null
}
