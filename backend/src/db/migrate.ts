import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from './index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function runMigrations() {
  migrate(db, {
    migrationsFolder: path.join(__dirname, 'migrations'),
  })
  console.log('Migrations applied')
}
