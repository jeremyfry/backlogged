import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { eq } from 'drizzle-orm'
import { games } from '../schema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsFolder = path.join(__dirname, '../migrations')

function createTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema: { games } })
  migrate(db, { migrationsFolder })
  return db
}

describe('games schema', () => {
  let db: ReturnType<typeof createTestDb>

  beforeEach(() => {
    db = createTestDb()
  })

  it('inserts and retrieves an owned game', async () => {
    await db.insert(games).values({
      title: 'Castlevania',
      platform: 'NES',
      language: 'English',
      ownershipStatus: 'owned',
      condition: 'complete_in_box',
      completionStatus: 'unplayed',
    })

    const result = await db.select().from(games)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Castlevania')
    expect(result[0].condition).toBe('complete_in_box')
    expect(result[0].ownershipStatus).toBe('owned')
    expect(result[0].completionStatus).toBe('unplayed')
  })

  it('inserts a wishlist game with wanted condition', async () => {
    await db.insert(games).values({
      title: 'Akumajo Dracula',
      platform: 'Famicom',
      language: 'Japanese',
      ownershipStatus: 'wishlist',
      condition: 'wanted',
      completionStatus: 'unplayed',
      targetPrice: 80.0,
    })

    const result = await db.select().from(games)
    expect(result[0].ownershipStatus).toBe('wishlist')
    expect(result[0].condition).toBe('wanted')
    expect(result[0].language).toBe('Japanese')
    expect(result[0].targetPrice).toBe(80.0)
  })

  it('stores HLTB data in minutes', async () => {
    await db.insert(games).values({
      title: 'Ocarina of Time',
      platform: 'N64',
      language: 'English',
      ownershipStatus: 'owned',
      completionStatus: 'completed',
      hltbMainStory: 1620,   // 27 hours
      hltbExtras: 2940,      // 49 hours
      hltbCompletionist: 4020, // 67 hours
    })

    const [game] = await db.select().from(games)
    expect(game.hltbMainStory).toBe(1620)
    expect(game.hltbExtras).toBe(2940)
    expect(game.hltbCompletionist).toBe(4020)
  })

  it('assigns and updates backlog position', async () => {
    const [inserted] = await db
      .insert(games)
      .values({
        title: 'Super Metroid',
        platform: 'SNES',
        language: 'English',
        ownershipStatus: 'owned',
        completionStatus: 'unplayed',
        backlogPosition: 1,
      })
      .returning()

    await db
      .update(games)
      .set({ backlogPosition: 2 })
      .where(eq(games.id, inserted.id))

    const [updated] = await db
      .select()
      .from(games)
      .where(eq(games.id, inserted.id))
    expect(updated.backlogPosition).toBe(2)
  })

  it('applies defaults for createdAt and updatedAt', async () => {
    await db.insert(games).values({
      title: 'Mega Man 2',
      platform: 'NES',
      language: 'English',
      ownershipStatus: 'owned',
      completionStatus: 'unplayed',
    })

    const [game] = await db.select().from(games)
    expect(game.createdAt).toBeTruthy()
    expect(game.updatedAt).toBeTruthy()
  })
})
