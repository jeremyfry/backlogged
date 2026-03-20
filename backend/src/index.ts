import { runMigrations } from './db/migrate.js'
import { initializeConfig, checkPasswordReset } from './config.js'
import app from './app.js'

const PORT = process.env.PORT ?? 3000

// Order matters: migrate DB, then handle auth config
runMigrations()
await initializeConfig()
await checkPasswordReset()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
