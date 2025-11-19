import { getDatabase } from './index'
import type {
  IContractTemplate,
  ICreateContractTemplateDTO,
  IUpdateContractTemplateDTO
} from '../../types'

/**
 * Get all contract templates
 */
export function getAllTemplates(): IContractTemplate[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT id, title, type, file_path, created_at, updated_at
    FROM contract_templates
    ORDER BY created_at DESC
  `)

  return stmt.all() as IContractTemplate[]
}

/**
 * Get a single contract template by ID
 */
export function getTemplateById(id: number): IContractTemplate | null {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT id, title, type, file_path, created_at, updated_at
    FROM contract_templates
    WHERE id = ?
  `)

  return (stmt.get(id) as IContractTemplate) || null
}

/**
 * Get a single contract template by file path
 */
export function getTemplateByPath(filePath: string): IContractTemplate | null {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT id, title, type, file_path, created_at, updated_at
    FROM contract_templates
    WHERE file_path = ?
  `)

  return (stmt.get(filePath) as IContractTemplate) || null
}

/**
 * Create a new contract template
 */
export function createTemplate(data: ICreateContractTemplateDTO): IContractTemplate {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO contract_templates (title, type, file_path, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `)

  const result = stmt.run(data.title, data.type, data.filePath)

  const newTemplate = getTemplateById(result.lastInsertRowid as number)

  if (!newTemplate) {
    throw new Error('Failed to create contract template')
  }

  return newTemplate
}

/**
 * Update an existing contract template
 */
export function updateTemplate(
  id: number,
  data: IUpdateContractTemplateDTO
): IContractTemplate | null {
  const existing = getTemplateById(id)

  if (!existing) {
    return null
  }

  const db = getDatabase()

  // Build dynamic update query
  const updates: string[] = []
  const values: (string | number)[] = []

  if (data.title !== undefined) {
    updates.push('title = ?')
    values.push(data.title)
  }

  if (data.type !== undefined) {
    updates.push('type = ?')
    values.push(data.type)
  }

  if (data.filePath !== undefined) {
    updates.push('file_path = ?')
    values.push(data.filePath)
  }

  if (updates.length === 0) {
    return existing
  }

  updates.push("updated_at = datetime('now')")
  values.push(id)

  const sql = `
    UPDATE contract_templates
    SET ${updates.join(', ')}
    WHERE id = ?
  `

  const stmt = db.prepare(sql)
  stmt.run(...values)

  return getTemplateById(id)
}

/**
 * Delete a contract template
 */
export function deleteTemplate(id: number): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM contract_templates WHERE id = ?')
  const result = stmt.run(id)

  return result.changes > 0
}

/**
 * Get templates by type
 */
export function getTemplatesByType(type: string): IContractTemplate[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT id, title, type, file_path, created_at, updated_at
    FROM contract_templates
    WHERE type = ?
    ORDER BY created_at DESC
  `)

  return stmt.all(type) as IContractTemplate[]
}
