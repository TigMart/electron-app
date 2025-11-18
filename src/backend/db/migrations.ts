import { getDatabase } from './connection'

/**
 * Run database migrations
 * Executes the schema.sql file to create tables
 */
export function runMigrations(): void {
  console.log('[Migrations] Running database migrations...')

  const db = getDatabase()

  // Inline schema instead of reading from file
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
    db.exec(schema)
    console.log('[Migrations] Migrations completed successfully')
  } catch (error) {
    console.error('[Migrations] Migration failed:', error)
    throw error
  }
}

/**
 * Initialize the database
 * Should be called on app startup
 */
export function initializeDatabase(): void {
  console.log('[Database] Initializing database...')

  try {
    runMigrations()
    console.log('[Database] Database initialized successfully')
  } catch (error) {
    console.error('[Database] Failed to initialize database:', error)
    throw error
  }
}
