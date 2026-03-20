#!/usr/bin/env tsx
/**
 * Set or reset the login password.
 *
 * Usage:
 *   npx tsx scripts/setup-password.ts <password>
 *   npx tsx scripts/setup-password.ts <username> <password>
 *
 * The hashed password is written to the config file (CONFIG_PATH or ./data/config.json).
 * To reset: SSH into the server, edit the config file, or re-run this script.
 */

import bcrypt from 'bcryptjs'
import { writeConfig, readConfig } from '../src/config.js'

const args = process.argv.slice(2)

let username: string
let password: string

if (args.length === 1) {
  const existing = readConfig()
  username = existing?.username ?? 'admin'
  password = args[0]
} else if (args.length === 2) {
  username = args[0]
  password = args[1]
} else {
  console.error('Usage:')
  console.error('  tsx scripts/setup-password.ts <password>')
  console.error('  tsx scripts/setup-password.ts <username> <password>')
  process.exit(1)
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters')
  process.exit(1)
}

const passwordHash = await bcrypt.hash(password, 12)
writeConfig({ username, passwordHash })

const configPath = process.env.CONFIG_PATH ?? './data/config.json'
console.log(`✓ Password set for user "${username}"`)
console.log(`  Config written to: ${configPath}`)
