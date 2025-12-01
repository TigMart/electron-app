import { ipcMain } from 'electron'
import * as contractTemplates from '../database/contract-templates'
import * as contracts from '../database/contracts'
import * as settings from '../database/settings'
import type {
  ICreateContractTemplateDTO,
  IUpdateContractTemplateDTO,
  ICreateContractDTO,
  IUpdateContractDTO,
  IUpdateSettingsDTO
} from '../../types'
import { logger } from '../utils/logger'

/**
 * Setup IPC handlers for database operations
 */
export function setupDatabaseHandlers(): void {
  logger.log('[IPC] Setting up database handlers...')

  // ==================== Contract Templates ====================

  ipcMain.handle('db:templates:getAll', async () => {
    try {
      return contractTemplates.getAllTemplates()
    } catch (error) {
      logger.error('[IPC] Error getting all templates:', error)
      throw error
    }
  })

  ipcMain.handle('db:templates:getById', async (_event, id: number) => {
    try {
      return contractTemplates.getTemplateById(id)
    } catch (error) {
      logger.error('[IPC] Error getting template by ID:', error)
      throw error
    }
  })

  ipcMain.handle('db:templates:getByPath', async (_event, filePath: string) => {
    try {
      return contractTemplates.getTemplateByPath(filePath)
    } catch (error) {
      logger.error('[IPC] Error getting template by path:', error)
      throw error
    }
  })

  ipcMain.handle('db:templates:create', async (_event, data: ICreateContractTemplateDTO) => {
    try {
      return contractTemplates.createTemplate(data)
    } catch (error) {
      logger.error('[IPC] Error creating template:', error)
      throw error
    }
  })

  ipcMain.handle(
    'db:templates:update',
    async (_event, id: number, data: IUpdateContractTemplateDTO) => {
      try {
        return contractTemplates.updateTemplate(id, data)
      } catch (error) {
        logger.error('[IPC] Error updating template:', error)
        throw error
      }
    }
  )

  ipcMain.handle('db:templates:delete', async (_event, id: number) => {
    try {
      return contractTemplates.deleteTemplate(id)
    } catch (error) {
      logger.error('[IPC] Error deleting template:', error)
      throw error
    }
  })

  ipcMain.handle('db:templates:getByType', async (_event, type: string) => {
    try {
      return contractTemplates.getTemplatesByType(type)
    } catch (error) {
      logger.error('[IPC] Error getting templates by type:', error)
      throw error
    }
  })

  // ==================== Contracts ====================

  ipcMain.handle('db:contracts:getAll', async () => {
    try {
      return contracts.getAllContracts()
    } catch (error) {
      logger.error('[IPC] Error getting all contracts:', error)
      throw error
    }
  })

  ipcMain.handle('db:contracts:getById', async (_event, id: number) => {
    try {
      return contracts.getContractById(id)
    } catch (error) {
      logger.error('[IPC] Error getting contract by ID:', error)
      throw error
    }
  })

  ipcMain.handle('db:contracts:create', async (_event, data: ICreateContractDTO) => {
    try {
      return contracts.createContract(data)
    } catch (error) {
      logger.error('[IPC] Error creating contract:', error)
      throw error
    }
  })

  ipcMain.handle('db:contracts:update', async (_event, id: number, data: IUpdateContractDTO) => {
    try {
      return contracts.updateContract(id, data)
    } catch (error) {
      logger.error('[IPC] Error updating contract:', error)
      throw error
    }
  })

  ipcMain.handle('db:contracts:delete', async (_event, id: number) => {
    try {
      return contracts.deleteContract(id)
    } catch (error) {
      logger.error('[IPC] Error deleting contract:', error)
      throw error
    }
  })

  // ==================== Settings ====================

  ipcMain.handle('db:settings:get', async () => {
    try {
      return settings.getSettings()
    } catch (error) {
      logger.error('[IPC] Error getting settings:', error)
      throw error
    }
  })

  ipcMain.handle('db:settings:update', async (_event, data: IUpdateSettingsDTO) => {
    try {
      return settings.updateSettings(data)
    } catch (error) {
      logger.error('[IPC] Error updating settings:', error)
      throw error
    }
  })

  ipcMain.handle('db:settings:reset', async () => {
    try {
      return settings.resetSettings()
    } catch (error) {
      logger.error('[IPC] Error resetting settings:', error)
      throw error
    }
  })

  // ==================== Generated Contracts ====================

  ipcMain.handle('db:contracts:listGenerated', async (_event, directoryPath: string) => {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')

      // Read the directory
      const entries = await fs.readdir(directoryPath, { withFileTypes: true })

      const files: Array<{
        name: string
        path: string
        size: number
        modified: number
        created: number
      }> = []

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.docx')) {
          const filePath = path.join(directoryPath, entry.name)
          const stats = await fs.stat(filePath)

          files.push({
            name: entry.name,
            path: filePath,
            size: stats.size,
            modified: stats.mtimeMs,
            created: stats.birthtimeMs
          })
        }
      }

      return files
    } catch (error) {
      logger.error('[IPC] Error listing generated contracts:', error)
      throw error
    }
  })

  ipcMain.handle('db:contracts:openFile', async (_event, filePath: string) => {
    try {
      const { shell } = await import('electron')
      const result = await shell.openPath(filePath)
      if (result) {
        throw new Error(`Failed to open file: ${result}`)
      }
      return true
    } catch (error) {
      logger.error('[IPC] Error opening contract file:', error)
      throw error
    }
  })

  ipcMain.handle('db:contracts:revealInExplorer', async (_event, filePath: string) => {
    try {
      const { shell } = await import('electron')
      await shell.showItemInFolder(filePath)
      return true
    } catch (error) {
      logger.error('[IPC] Error revealing contract file:', error)
      throw error
    }
  })

  ipcMain.handle('db:contracts:deleteGenerated', async (_event, filePath: string) => {
    try {
      const { shell } = await import('electron')
      await shell.trashItem(filePath)
      return true
    } catch (error) {
      logger.error('[IPC] Error deleting generated contract:', error)
      throw error
    }
  })

  logger.log('[IPC] Database handlers setup complete')
}
