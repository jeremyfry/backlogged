import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { games } from '../../db/schema.js'
import {
  listGames,
  getGame,
  createGame,
  updateGame,
  deleteGame,
  reorderBacklog,
} from '../games.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsFolder = path.join(__dirname, '../../db/migrations')

function createTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema: { games } })
  migrate(db, { migrationsFolder })
  return db
}

const base = {
  platform: 'SNES',
  language: 'English',
  ownershipStatus: 'owned' as const,
  completionStatus: 'unplayed' as const,
}

describe('games service', () => {
  let db: ReturnType<typeof createTestDb>

  beforeEach(() => {
    db = createTestDb()
  })

  describe('createGame / getGame', () => {
    it('creates and retrieves a game by id', async () => {
      const game = await createGame({ ...base, title: 'Super Metroid' }, db)
      expect(game.id).toBeTypeOf('number')

      const fetched = await getGame(game.id, db)
      expect(fetched?.title).toBe('Super Metroid')
    })

    it('returns null for a missing id', async () => {
      expect(await getGame(999, db)).toBeNull()
    })
  })

  describe('listGames', () => {
    beforeEach(async () => {
      await createGame({ ...base, title: 'Contra', platform: 'NES', language: 'English' }, db)
      await createGame({ ...base, title: 'Castlevania', platform: 'NES', language: 'Japanese' }, db)
      await createGame({ ...base, title: 'Super Metroid', completionStatus: 'completed', ownershipStatus: 'wishlist' }, db)
    })

    it('returns all games with no filters', async () => {
      expect(await listGames({}, db)).toHaveLength(3)
    })

    it('filters by title search', async () => {
      const result = await listGames({ search: 'Contra' }, db)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Contra')
    })

    it('filters by platform', async () => {
      const result = await listGames({ platform: 'NES' }, db)
      expect(result).toHaveLength(2)
    })

    it('filters by language', async () => {
      const result = await listGames({ language: 'Japanese' }, db)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Castlevania')
    })

    it('filters by ownershipStatus', async () => {
      const result = await listGames({ ownershipStatus: 'wishlist' }, db)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Super Metroid')
    })

    it('filters by completionStatus', async () => {
      const result = await listGames({ completionStatus: 'completed' }, db)
      expect(result).toHaveLength(1)
    })

    it('sorts by title ascending by default', async () => {
      const result = await listGames({}, db)
      expect(result.map((g) => g.title)).toEqual(['Castlevania', 'Contra', 'Super Metroid'])
    })

    it('sorts descending', async () => {
      const result = await listGames({ order: 'desc' }, db)
      expect(result[0].title).toBe('Super Metroid')
    })
  })

  describe('updateGame', () => {
    it('updates fields and returns the updated game', async () => {
      const game = await createGame({ ...base, title: 'Metroid' }, db)
      const updated = await updateGame(game.id, { completionStatus: 'completed' }, db)
      expect(updated?.completionStatus).toBe('completed')
      expect(updated?.title).toBe('Metroid')
    })

    it('updates updatedAt timestamp', async () => {
      const game = await createGame({ ...base, title: 'Metroid' }, db)
      const updated = await updateGame(game.id, { notes: 'great game' }, db)
      expect(updated?.updatedAt).not.toBe(game.createdAt)
    })

    it('returns null for a missing id', async () => {
      expect(await updateGame(999, { notes: 'nope' }, db)).toBeNull()
    })
  })

  describe('deleteGame', () => {
    it('deletes a game and returns it', async () => {
      const game = await createGame({ ...base, title: 'Battletoads' }, db)
      const deleted = await deleteGame(game.id, db)
      expect(deleted?.title).toBe('Battletoads')
      expect(await getGame(game.id, db)).toBeNull()
    })

    it('returns null for a missing id', async () => {
      expect(await deleteGame(999, db)).toBeNull()
    })
  })

  describe('reorderBacklog', () => {
    it('assigns backlog positions in given order', async () => {
      const a = await createGame({ ...base, title: 'Game A' }, db)
      const b = await createGame({ ...base, title: 'Game B' }, db)
      const c = await createGame({ ...base, title: 'Game C' }, db)

      await reorderBacklog([c.id, a.id, b.id], db)

      expect((await getGame(c.id, db))?.backlogPosition).toBe(1)
      expect((await getGame(a.id, db))?.backlogPosition).toBe(2)
      expect((await getGame(b.id, db))?.backlogPosition).toBe(3)
    })
  })
})
