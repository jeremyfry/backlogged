import { runMigrations } from './db/migrate.js'
import { checkPasswordReset } from './config.js'
import app from './app.js'

const PORT = process.env.PORT ?? 3000

runMigrations()
await checkPasswordReset()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
