import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const games = sqliteTable('games', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Core metadata
  title: text('title').notNull(),
  platform: text('platform').notNull(),
  language: text('language').notNull().default('English'),
  genre: text('genre'),
  developer: text('developer'),
  publisher: text('publisher'),
  releaseYear: integer('release_year'),
  coverArtUrl: text('cover_art_url'),
  igdbId: integer('igdb_id'),
  personalRating: integer('personal_rating'), // 1-10
  completionStatus: text('completion_status', {
    enum: ['unplayed', 'up_next', 'in_progress', 'completed', 'dropped'],
  })
    .notNull()
    .default('unplayed'),

  // HowLongToBeat (stored in minutes)
  hltbMainStory: integer('hltb_main_story'),
  hltbExtras: integer('hltb_extras'),
  hltbCompletionist: integer('hltb_completionist'),

  notes: text('notes'),

  // Personal completion tracking
  completionDate: text('completion_date'),   // ISO date string e.g. "2024-03-15"
  personalPlaytime: integer('personal_playtime'), // Minutes

  // Ownership
  ownershipStatus: text('ownership_status', {
    enum: ['owned', 'wishlist', 'digital'],
  }).notNull(),
  condition: text('condition', {
    enum: ['wanted', 'sealed', 'complete_in_box', 'loose', 'incomplete'],
  }),

  // Owned game fields
  purchasePrice: real('purchase_price'),
  purchaseDate: text('purchase_date'), // ISO date string e.g. "2024-03-15"
  purchaseLocation: text('purchase_location'),

  // Wishlist field
  targetPrice: real('target_price'),

  // Backlog ordering (null = not in backlog)
  backlogPosition: integer('backlog_position'),

  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type GameRow = typeof games.$inferSelect
export type InsertGameRow = typeof games.$inferInsert
