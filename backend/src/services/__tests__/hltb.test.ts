import { describe, it, expect, beforeEach } from 'vitest'
import { searchHltb, clearTokenCache } from '../hltb.js'

// Mock fetch that simulates the new HLTB API
function makeFetch(games: object[]) {
  let calls = 0
  return async (url: string | URL | Request, opts?: RequestInit) => {
    calls++
    if (url.toString().includes('/api/finder/init')) {
      return { ok: true, json: async () => ({ token: 'test-token' }) } as Response
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: games }),
    } as Response
  }
}

function makeGame(overrides: object = {}) {
  return {
    game_id: 1,
    game_name: 'Castlevania',
    comp_main: 16200,   // 270 min in seconds
    comp_plus: 28800,   // 480 min in seconds
    comp_100: 43200,    // 720 min in seconds
    ...overrides,
  }
}

describe('searchHltb', () => {
  beforeEach(() => clearTokenCache())
  it('returns normalized results with minutes', async () => {
    const results = await searchHltb('castlevania', makeFetch([makeGame()]))

    expect(results).toHaveLength(1)
    const [r] = results
    expect(r.hltbId).toBe(1)
    expect(r.title).toBe('Castlevania')
    expect(r.mainStory).toBe(270)
    expect(r.mainExtra).toBe(480)
    expect(r.completionist).toBe(720)
  })

  it('rounds fractional seconds to nearest minute', async () => {
    const [r] = await searchHltb('test', makeFetch([makeGame({ comp_main: 1234 })]))
    expect(r.mainStory).toBe(21) // Math.round(1234 / 60) = 21
  })

  it('returns null for zero-value times (not available)', async () => {
    const [r] = await searchHltb(
      'test',
      makeFetch([makeGame({ comp_main: 0, comp_plus: 0, comp_100: 0 })]),
    )
    expect(r.mainStory).toBeNull()
    expect(r.mainExtra).toBeNull()
    expect(r.completionist).toBeNull()
  })

  it('returns empty array when no results', async () => {
    expect(await searchHltb('xyznotreal', makeFetch([]))).toEqual([])
  })

  it('returns multiple results', async () => {
    const games = [
      makeGame({ game_id: 1, game_name: 'Castlevania' }),
      makeGame({ game_id: 2, game_name: "Castlevania II: Simon's Quest" }),
    ]
    const results = await searchHltb('castlevania', makeFetch(games))
    expect(results).toHaveLength(2)
    expect(results[1].title).toBe("Castlevania II: Simon's Quest")
  })

  it('retries with fresh token on 403', async () => {
    let tokenCalls = 0
    let searchCalls = 0
    const fetchFn = async (url: string | URL | Request) => {
      if (url.toString().includes('/api/finder/init')) {
        tokenCalls++
        return { ok: true, json: async () => ({ token: `token-${tokenCalls}` }) } as Response
      }
      searchCalls++
      if (searchCalls === 1) {
        return { ok: false, status: 403, json: async () => ({}) } as Response
      }
      return { ok: true, status: 200, json: async () => ({ data: [makeGame()] }) } as Response
    }
    const results = await searchHltb('test', fetchFn)
    expect(results).toHaveLength(1)
    expect(tokenCalls).toBe(2) // initial + refresh
  })
})
