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
