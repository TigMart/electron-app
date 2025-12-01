import { getDatabase } from './index'
import type { IContract, ICreateContractDTO, IUpdateContractDTO } from '../../types'

/**
 * Get all contracts with template information
 */
export function getAllContracts(): IContract[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT 
      c.id,
      c.title,
      c.template_id,
      c.created_at,
      c.updated_at,
      ct.title as template_title,
      ct.type as template_type
    FROM contracts c
    LEFT JOIN contract_templates ct ON c.template_id = ct.id
    ORDER BY c.created_at DESC
  `)

  return stmt.all() as IContract[]
}

/**
 * Get a single contract by ID
 */
export function getContractById(id: number): IContract | null {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT 
      c.id,
      c.title,
      c.template_id,
      c.created_at,
      c.updated_at,
      ct.title as template_title,
      ct.type as template_type,
      ct.file_path as template_docx_path
    FROM contracts c
    LEFT JOIN contract_templates ct ON c.template_id = ct.id
    WHERE c.id = ?
  `)

  return (stmt.get(id) as IContract) || null
}

/**
 * Create a new contract
 */
export function createContract(data: ICreateContractDTO): IContract {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO contracts (title, template_id, created_at, updated_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
  `)

  const result = stmt.run(data.title, data.templateId)

  const newContract = getContractById(result.lastInsertRowid as number)

  if (!newContract) {
    throw new Error('Failed to create contract')
  }

  return newContract
}

/**
 * Update an existing contract
 */
export function updateContract(id: number, data: IUpdateContractDTO): IContract | null {
  const existing = getContractById(id)

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

  if (data.templateId !== undefined) {
    updates.push('template_id = ?')
    values.push(data.templateId)
  }

  if (updates.length === 0) {
    return existing
  }

  updates.push("updated_at = datetime('now')")
  values.push(id)

  const sql = `
    UPDATE contracts
    SET ${updates.join(', ')}
    WHERE id = ?
  `

  const stmt = db.prepare(sql)
  stmt.run(...values)

  return getContractById(id)
}

/**
 * Delete a contract
 */
export function deleteContract(id: number): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM contracts WHERE id = ?')
  const result = stmt.run(id)

  return result.changes > 0
}
