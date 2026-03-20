import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import bcrypt from 'bcryptjs'

// Use a temp dir per test so tests are fully isolated
function makeTempDir() {
  const dir = path.join(os.tmpdir(), `backlogged-test-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

describe('initializeConfig', () => {
  let tmpDir: string
  let originalExit: typeof process.exit

  beforeEach(() => {
    tmpDir = makeTempDir()
    process.env.CONFIG_PATH = path.join(tmpDir, 'config.json')
    originalExit = process.exit
    // Prevent process.exit from killing the test runner
    process.exit = vi.fn() as never
  })

  afterEach(() => {
    process.exit = originalExit
    delete process.env.CONFIG_PATH
    delete process.env.INITIAL_USERNAME
    delete process.env.INITIAL_PASSWORD
  })

  it('creates config from env vars on first start', async () => {
    const { initializeConfig } = await import('../config.js')
    process.env.INITIAL_USERNAME = 'admin'
    process.env.INITIAL_PASSWORD = 'securepass123'

    await initializeConfig()

    const { readConfig } = await import('../config.js')
    const config = readConfig()
    expect(config?.username).toBe('admin')
    expect(await bcrypt.compare('securepass123', config!.passwordHash)).toBe(true)
  })

  it('does nothing when no config and no env vars set (frontend handles setup)', async () => {
    const { initializeConfig, readConfig } = await import('../config.js')

    await initializeConfig()

    // Server starts without credentials — no exit, no config written
    expect(process.exit).not.toHaveBeenCalled()
    expect(readConfig()).toBeNull()
  })

  it('does nothing if config already exists', async () => {
    const { writeConfig, initializeConfig, readConfig } = await import('../config.js')
    const existing = { username: 'existing', passwordHash: 'hash' }
    writeConfig(existing)

    process.env.INITIAL_USERNAME = 'newuser'
    process.env.INITIAL_PASSWORD = 'newpassword123'
    await initializeConfig()

    expect(readConfig()?.username).toBe('existing')
  })
})

describe('checkPasswordReset', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = makeTempDir()
    process.env.CONFIG_PATH = path.join(tmpDir, 'config.json')
  })

  afterEach(() => {
    delete process.env.CONFIG_PATH
  })

  it('resets password from reset-pass.txt', async () => {
    const { writeConfig, checkPasswordReset, readConfig } = await import('../config.js')
    writeConfig({ username: 'admin', passwordHash: 'oldhash' })
    writeFileSync(path.join(tmpDir, 'reset-pass.txt'), 'newpassword123')

    await checkPasswordReset()

    const config = readConfig()
    expect(config?.username).toBe('admin')
    expect(await bcrypt.compare('newpassword123', config!.passwordHash)).toBe(true)
  })

  it('resets both username and password with colon format', async () => {
    const { writeConfig, checkPasswordReset, readConfig } = await import('../config.js')
    writeConfig({ username: 'admin', passwordHash: 'oldhash' })
    writeFileSync(path.join(tmpDir, 'reset-pass.txt'), 'newuser:newpassword123')

    await checkPasswordReset()

    const config = readConfig()
    expect(config?.username).toBe('newuser')
    expect(await bcrypt.compare('newpassword123', config!.passwordHash)).toBe(true)
  })

  it('deletes reset-pass.txt after applying', async () => {
    const { writeConfig, checkPasswordReset } = await import('../config.js')
    writeConfig({ username: 'admin', passwordHash: 'oldhash' })
    const resetPath = path.join(tmpDir, 'reset-pass.txt')
    writeFileSync(resetPath, 'newpassword123')

    await checkPasswordReset()

    expect(existsSync(resetPath)).toBe(false)
  })

  it('does nothing if reset-pass.txt does not exist', async () => {
    const { writeConfig, checkPasswordReset, readConfig } = await import('../config.js')
    writeConfig({ username: 'admin', passwordHash: 'originalhash' })

    await checkPasswordReset()

    expect(readConfig()?.passwordHash).toBe('originalhash')
  })

  it('skips reset if password is too short', async () => {
    const { writeConfig, checkPasswordReset, readConfig } = await import('../config.js')
    writeConfig({ username: 'admin', passwordHash: 'originalhash' })
    writeFileSync(path.join(tmpDir, 'reset-pass.txt'), 'short')

    await checkPasswordReset()

    expect(readConfig()?.passwordHash).toBe('originalhash')
  })
})
