import { getDatabase } from './index'
import type { ISettings, IUpdateSettingsDTO } from '../../types'

/**
 * Get settings (singleton - only one row exists)
 */
export function getSettings(): ISettings | null {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT id, contract_templates_dir, generated_contracts_dir, updated_at
    FROM settings
    WHERE id = 1
  `)

  return (stmt.get() as ISettings) || null
}

/**
 * Update settings (upsert)
 */
export function updateSettings(data: IUpdateSettingsDTO): ISettings {
  const db = getDatabase()

  const stmt = db.prepare(`
    INSERT INTO settings (id, contract_templates_dir, generated_contracts_dir, updated_at)
    VALUES (1, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      contract_templates_dir = excluded.contract_templates_dir,
      generated_contracts_dir = excluded.generated_contracts_dir,
      updated_at = datetime('now')
  `)

  stmt.run(data.contractTemplatesDir, data.generatedContractsDir)

  const updated = getSettings()

  if (!updated) {
    throw new Error('Failed to update settings')
  }

  return updated
}

/**
 * Reset settings to defaults
 */
export function resetSettings(): ISettings {
  return updateSettings({
    contractTemplatesDir: '',
    generatedContractsDir: ''
  })
}
