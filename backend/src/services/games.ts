import { eq, like, and, asc, desc, max, type SQL } from 'drizzle-orm'
import { db as defaultDb, createDb, type DB } from '../db/index.js'
import { games, type InsertGameRow } from '../db/schema.js'
import type { CreateGameInput, UpdateGameInput } from '@backlogged/types'

export interface ListGamesFilters {
  search?: string
  ownershipStatus?: string
  platform?: string
  language?: string
  completionStatus?: string
  sort?: string
  order?: 'asc' | 'desc'
}

function buildConditions(filters: ListGamesFilters): SQL[] {
  const conditions: SQL[] = []
  if (filters.search) conditions.push(like(games.title, `%${filters.search}%`))
  if (filters.ownershipStatus) conditions.push(eq(games.ownershipStatus, filters.ownershipStatus as never))
  if (filters.platform) conditions.push(eq(games.platform, filters.platform))
  if (filters.language) conditions.push(eq(games.language, filters.language))
  if (filters.completionStatus) conditions.push(eq(games.completionStatus, filters.completionStatus as never))
  return conditions
}

function sortColumn(sort?: string) {
  switch (sort) {
    case 'platform': return games.platform
    case 'releaseYear': return games.releaseYear
    case 'personalRating': return games.personalRating
    case 'backlogPosition': return games.backlogPosition
    default: return games.title
  }
}

export async function listGames(filters: ListGamesFilters, dbInstance: DB = defaultDb) {
  const conditions = buildConditions(filters)
  const orderFn = filters.order === 'desc' ? desc : asc
  return dbInstance
    .select()
    .from(games)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderFn(sortColumn(filters.sort)))
}

export async function getGame(id: number, dbInstance: DB = defaultDb) {
  const [game] = await dbInstance.select().from(games).where(eq(games.id, id))
  return game ?? null
}

async function nextBacklogPosition(dbInstance: DB): Promise<number> {
  const [row] = await dbInstance
    .select({ max: max(games.backlogPosition) })
    .from(games)
    .where(eq(games.completionStatus, 'up_next'))
  return (row?.max ?? 0) + 1
}

export async function createGame(input: CreateGameInput, dbInstance: DB = defaultDb) {
  const values = { ...input } as InsertGameRow
  if (values.completionStatus === 'up_next' && !values.backlogPosition) {
    values.backlogPosition = await nextBacklogPosition(dbInstance)
  }
  const [game] = await dbInstance.insert(games).values(values).returning()
  return game
}

export async function updateGame(id: number, input: UpdateGameInput, dbInstance: DB = defaultDb) {
  const set: Partial<InsertGameRow> = {
    ...(input as Partial<InsertGameRow>),
    updatedAt: new Date().toISOString(),
  }
  if (input.completionStatus === 'up_next') {
    const existing = await getGame(id, dbInstance)
    if (!existing?.backlogPosition) {
      set.backlogPosition = await nextBacklogPosition(dbInstance)
    }
  } else if (input.completionStatus !== undefined) {
    // Changing away from up_next — clear position
    set.backlogPosition = null
  }
  const [game] = await dbInstance
    .update(games)
    .set(set)
    .where(eq(games.id, id))
    .returning()
  return game ?? null
}

export async function deleteGame(id: number, dbInstance: DB = defaultDb) {
  const [game] = await dbInstance.delete(games).where(eq(games.id, id)).returning()
  return game ?? null
}

export function reorderBacklog(orderedIds: number[], dbInstance: DB = defaultDb) {
  const updatedAt = new Date().toISOString()
  dbInstance.transaction((tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      tx.update(games)
        .set({ backlogPosition: i + 1, updatedAt })
        .where(eq(games.id, orderedIds[i]))
        .run()
    }
  })
}

export { createDb }
