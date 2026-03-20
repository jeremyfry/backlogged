import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import * as schema from './schema.js'

function createDb(dbPath: string) {
  mkdirSync(path.dirname(dbPath), { recursive: true })
  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return drizzle(sqlite, { schema })
}

const dbPath =
  process.env.DATABASE_PATH ??
  path.join(process.cwd(), 'data', 'backlogged.db')

export const db = createDb(dbPath)
export type DB = typeof db

export { createDb }
