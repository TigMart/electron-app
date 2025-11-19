import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { logger } from '../utils/logger'

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

  logger.log('[Database] Opening database at:', dbPath)

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

  logger.log('[Database] Database connection established')

  return db
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    logger.log('[Database] Closing database connection')
    db.close()
    db = null
  }
}

/**
 * Run database migrations
 * Executes the schema to create tables
 */
export function runMigrations(): void {
  logger.log('[Migrations] Running database migrations...')

  const database = getDatabase()

  // Inline schema
  const schema = `
-- Contract Templates Table
CREATE TABLE IF NOT EXISTS contract_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Settings Table (Singleton pattern - only one row with id=1)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  contract_templates_dir TEXT,
  generated_contracts_dir TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contract_templates_type ON contract_templates(type);
CREATE INDEX IF NOT EXISTS idx_contract_templates_created_at ON contract_templates(created_at);

-- Insert default settings if not exists
INSERT OR IGNORE INTO settings (id, contract_templates_dir, generated_contracts_dir)
VALUES (1, NULL, NULL);
`

  // Execute schema
  try {
    database.exec(schema)
    logger.log('[Migrations] Migrations completed successfully')
  } catch (error) {
    logger.error('[Migrations] Migration failed:', error)
    throw error
  }
}

/**
 * Initialize the database
 * Should be called on app startup
 */
export function initializeDatabase(): void {
  logger.log('[Database] Initializing database...')

  try {
    runMigrations()
    logger.log('[Database] Database initialized successfully')
  } catch (error) {
    logger.error('[Database] Failed to initialize database:', error)
    throw error
  }
}
