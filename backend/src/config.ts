import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
} from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'

export interface AppConfig {
  username: string
  passwordHash: string
}

export function getConfigPath(): string {
  return process.env.CONFIG_PATH ?? path.join(process.cwd(), 'data', 'config.json')
}

export function readConfig(): AppConfig | null {
  const configPath = getConfigPath()
  if (!existsSync(configPath)) return null
  return JSON.parse(readFileSync(configPath, 'utf-8')) as AppConfig
}

export function writeConfig(config: AppConfig): void {
  const configPath = getConfigPath()
  mkdirSync(path.dirname(configPath), { recursive: true })
  writeFileSync(configPath, JSON.stringify(config, null, 2))
}

/**
 * On first start (no config file), optionally auto-create from INITIAL_USERNAME /
 * INITIAL_PASSWORD env vars (useful for Docker/automated deploys).
 * If neither env var is set, the server starts unconfigured and the frontend
 * first-run setup flow handles credential creation.
 */
export async function initializeConfig(): Promise<void> {
  if (readConfig() !== null) return

  const username = process.env.INITIAL_USERNAME
  const password = process.env.INITIAL_PASSWORD

  if (!username || !password) {
    console.log('No credentials configured — complete first-time setup in the app.')
    return
  }

  if (password.length < 8) {
    console.warn('INITIAL_PASSWORD must be at least 8 characters — skipping auto-setup.')
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  writeConfig({ username, passwordHash })
  console.log(`Created login for user "${username}" from environment variables`)
}

/**
 * On startup, check for a reset-pass.txt file in the data directory.
 * File format:  newpassword
 *           or: newusername:newpassword
 * The file is deleted after a successful reset.
 */
export async function checkPasswordReset(): Promise<void> {
  const dataDir = path.dirname(getConfigPath())
  const resetPath = path.join(dataDir, 'reset-pass.txt')

  if (!existsSync(resetPath)) return

  const content = readFileSync(resetPath, 'utf-8').trim()
  unlinkSync(resetPath)

  let username: string
  let password: string

  if (content.includes(':')) {
    const colonIdx = content.indexOf(':')
    username = content.slice(0, colonIdx)
    password = content.slice(colonIdx + 1)
  } else {
    const existing = readConfig()
    username = existing?.username ?? 'admin'
    password = content
  }

  if (password.length < 8) {
    console.error('reset-pass.txt: password must be at least 8 characters — skipping reset')
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  writeConfig({ username, passwordHash })
  console.log(`Password reset for user "${username}" via reset-pass.txt`)
}
