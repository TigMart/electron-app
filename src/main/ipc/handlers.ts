import { ipcMain } from 'electron'
import * as contractTemplates from '../database/contract-templates'
import * as settings from '../database/settings'
import type {
  ICreateContractTemplateDTO,
  IUpdateContractTemplateDTO,
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

  logger.log('[IPC] Database handlers setup complete')
}
