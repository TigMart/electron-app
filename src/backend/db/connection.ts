import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

/**
 * Get the SQLite database connection
 * Stored in userData directory for persistence across updates
 */
export function getDatabase(): Database.Database {
  if (db) {
    return db
  }

  // Store DB in Electron's userData directory
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'contracts.db')

  console.log('[Database] Opening database at:', dbPath)

  // Ensure directory exists
  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // Create database connection
  db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
  })

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL')

  console.log('[Database] Database connection established')

  return db
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    console.log('[Database] Closing database connection')
    db.close()
    db = null
  }
}

/**
 * Get the database file path
 */
export function getDatabasePath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'contracts.db')
}
