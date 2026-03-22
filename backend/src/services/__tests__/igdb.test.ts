import { describe, it, expect, beforeEach, vi } from 'vitest'
import { searchGames, getIgdbGame, coverUrl, clearTokenCache } from '../igdb.js'

const MOCK_TOKEN = 'mock-access-token'
const CLIENT_ID = 'test-client-id'

const mockTokenResponse = {
  access_token: MOCK_TOKEN,
  expires_in: 5184000, // 60 days
}

const mockRawGame = {
  id: 6,
  name: 'Castlevania',
  cover: { image_id: 'abc123' },
  first_release_date: 536457600, // 1987-00-00 approx
  platforms: [{ name: 'NES' }, { name: 'Family Computer' }],
  genres: [{ name: 'Platform' }, { name: 'Adventure' }],
  involved_companies: [
    { developer: true, publisher: false, company: { name: 'Konami' } },
    { developer: false, publisher: true, company: { name: 'Konami' } },
  ],
  summary: 'A classic action platformer.',
}

function makeFetch(igdbResponse: unknown) {
  return vi.fn().mockImplementation((url: string) => {
    if (String(url).includes('twitch.tv')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      })
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(igdbResponse),
    })
  })
}

describe('coverUrl', () => {
  it('builds a cover_big URL by default', () => {
    expect(coverUrl('abc123')).toBe(
      'https://images.igdb.com/igdb/image/upload/t_cover_big/abc123.jpg',
    )
  })

  it('accepts a custom size', () => {
    expect(coverUrl('abc123', 'thumb')).toBe(
      'https://images.igdb.com/igdb/image/upload/t_thumb/abc123.jpg',
    )
  })
})

describe('searchGames', () => {
  beforeEach(() => {
    clearTokenCache()
    process.env.IGDB_CLIENT_ID = CLIENT_ID
    process.env.IGDB_CLIENT_SECRET = 'test-secret'
  })

  it('returns normalized results', async () => {
    const fetchFn = makeFetch([mockRawGame])
    const results = await searchGames('castlevania', {}, fetchFn)

    expect(results).toHaveLength(1)
    const game = results[0]
    expect(game.igdbId).toBe(6)
    expect(game.title).toBe('Castlevania')
    expect(game.coverUrl).toBe('https://images.igdb.com/igdb/image/upload/t_cover_big/abc123.jpg')
    expect(game.platforms).toContain('NES')
    expect(game.genres).toContain('Platform')
    expect(game.developer).toBe('Konami')
    expect(game.publisher).toBe('Konami')
    expect(game.summary).toBe('A classic action platformer.')
  })

  it('derives release year from unix timestamp', async () => {
    const fetchFn = makeFetch([mockRawGame])
    const [result] = await searchGames('castlevania', {}, fetchFn)
    expect(result.releaseYear).toBe(1986)
  })

  it('returns null coverUrl when no cover', async () => {
    const fetchFn = makeFetch([{ ...mockRawGame, cover: undefined }])
    const [result] = await searchGames('castlevania', {}, fetchFn)
    expect(result.coverUrl).toBeNull()
  })

  it('returns null developer/publisher when no involved_companies', async () => {
    const fetchFn = makeFetch([{ ...mockRawGame, involved_companies: undefined }])
    const [result] = await searchGames('castlevania', {}, fetchFn)
    expect(result.developer).toBeNull()
    expect(result.publisher).toBeNull()
  })

  it('returns empty array when no results', async () => {
    const fetchFn = makeFetch([])
    expect(await searchGames('xyznotarealthing', {}, fetchFn)).toEqual([])
  })

  it('escapes double quotes in the search query', async () => {
    const fetchFn = makeFetch([])
    await searchGames('some "quoted" title', {}, fetchFn)
    const body = fetchFn.mock.calls[1][1].body as string
    expect(body).toContain('some \\"quoted\\" title')
  })

  it('reuses cached token on second call', async () => {
    const fetchFn = makeFetch([])
    await searchGames('foo', {}, fetchFn)
    await searchGames('bar', {}, fetchFn)
    const tokenCalls = fetchFn.mock.calls.filter((c: unknown[]) =>
      String(c[0]).includes('twitch.tv'),
    )
    expect(tokenCalls).toHaveLength(1)
  })

  it('throws if env vars are not set', async () => {
    clearTokenCache()
    delete process.env.IGDB_CLIENT_ID
    delete process.env.IGDB_CLIENT_SECRET
    await expect(searchGames('test', {}, makeFetch([]))).rejects.toThrow(
      'IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set',
    )
  })
})

describe('getIgdbGame', () => {
  beforeEach(() => {
    clearTokenCache()
    process.env.IGDB_CLIENT_ID = CLIENT_ID
    process.env.IGDB_CLIENT_SECRET = 'test-secret'
  })

  it('returns a normalized game by id', async () => {
    const fetchFn = makeFetch([mockRawGame])
    const game = await getIgdbGame(6, fetchFn)
    expect(game?.igdbId).toBe(6)
    expect(game?.title).toBe('Castlevania')
  })

  it('returns null when not found', async () => {
    const fetchFn = makeFetch([])
    expect(await getIgdbGame(999999, fetchFn)).toBeNull()
  })
})
