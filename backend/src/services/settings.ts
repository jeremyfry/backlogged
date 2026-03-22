import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import type { AppSettings } from '@backlogged/types'

const DEFAULT_SETTINGS: AppSettings = {
  igdbPlatforms: [],
  defaultCondition: null,
}

function getSettingsPath(): string {
  if (process.env.SETTINGS_PATH) return process.env.SETTINGS_PATH
  const configPath = process.env.CONFIG_PATH ?? path.join(process.cwd(), 'data', 'config.json')
  return path.join(path.dirname(configPath), 'settings.json')
}

export function readSettings(): AppSettings {
  const p = getSettingsPath()
  if (!existsSync(p)) return { ...DEFAULT_SETTINGS }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(readFileSync(p, 'utf-8')) } as AppSettings
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function writeSettings(settings: AppSettings): void {
  const p = getSettingsPath()
  mkdirSync(path.dirname(p), { recursive: true })
  writeFileSync(p, JSON.stringify(settings, null, 2))
}
