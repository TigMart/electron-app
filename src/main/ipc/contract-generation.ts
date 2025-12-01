import { ipcMain, app, shell } from 'electron'
import { getContractById } from '../database/contracts'
import { generateDocxFromTemplate, validateTemplate } from '../services/docx-generator.service'
import {
  generateContractDataWithAI,
  extractDocxText,
  extractPlaceholders
} from '../services/openai.service'
import { getSettings } from '../database/settings'
import path from 'path'
import { logger } from '../utils/logger'

/**
 * Register IPC handlers for contract generation
 */
export function registerContractGenerationHandlers(): void {
  /**
   * Generate a contract from template with JSON data + OpenAI
   * Input: { contractId: number, jsonData: string }
   * Output: { success: boolean, filePath: string, fileName: string }
   */
  ipcMain.handle('generate-contract', async (_event, { contractId, jsonData }) => {
    try {
      logger.log('[IPC] Generate contract request for ID:', contractId)

      // 1. Get contract from database
      const contract = getContractById(contractId)
      if (!contract) {
        throw new Error('Contract not found')
      }

      logger.log('[IPC] Contract found:', contract.title)

      // 2. Check if template path exists
      if (!contract.template_docx_path) {
        throw new Error(
          'Contract template path is not set. Please ensure the template file is uploaded.'
        )
      }

      // 3. Validate template file exists
      await validateTemplate(contract.template_docx_path)

      // 4. Parse and validate JSON data
      let parsedData: Record<string, unknown>
      try {
        parsedData = JSON.parse(jsonData)
        logger.log('[IPC] JSON data parsed successfully')
      } catch {
        throw new Error('Invalid JSON format. Please check your input.')
      }

      // 5. Extract template content and placeholders for OpenAI
      const templateText = await extractDocxText(contract.template_docx_path)
      const placeholders = extractPlaceholders(templateText)

      logger.log('[IPC] Extracted placeholders:', placeholders)

      // 6. Use OpenAI to intelligently fill the data
      let filledData: Record<string, unknown>

      if (process.env.OPENAI_API_KEY) {
        logger.log('[IPC] Using OpenAI to generate contract data...')
        filledData = await generateContractDataWithAI(templateText, parsedData, placeholders)
      } else {
        logger.warn('[IPC] No OpenAI API key, using raw data')
        filledData = parsedData
      }

      // 7. Get output directory from settings
      const settings = getSettings()
      const outputDir =
        settings?.generated_contracts_dir ||
        path.join(app.getPath('documents'), 'Generated Contracts')

      logger.log('[IPC] Output directory:', outputDir)

      // 8. Generate file name with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
      const safeTitle = contract.title.replace(/[^a-z0-9]/gi, '_')
      const fileName = `${safeTitle}_${timestamp}.docx`
      const outputPath = path.join(outputDir, fileName)

      logger.log('[IPC] Generating document:', fileName)

      // 9. Generate the DOCX file with filled data
      const generatedPath = await generateDocxFromTemplate(
        contract.template_docx_path,
        filledData,
        outputPath
      )

      logger.log('[IPC] Contract generated successfully:', generatedPath)

      return {
        success: true,
        filePath: generatedPath,
        fileName: fileName
      }
    } catch (error) {
      logger.error('[IPC] Contract generation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate contract'
      throw new Error(errorMessage)
    }
  })

  /**
   * Open a file in the system's default application
   * Input: filePath (string)
   */
  ipcMain.handle('open-file', async (_event, filePath: string) => {
    try {
      logger.log('[IPC] Opening file:', filePath)
      const result = await shell.openPath(filePath)

      if (result) {
        throw new Error(`Failed to open file: ${result}`)
      }

      return { success: true }
    } catch (error) {
      logger.error('[IPC] Failed to open file:', error)
      throw error
    }
  })

  /**
   * Open the containing folder of a file
   * Input: filePath (string)
   */
  ipcMain.handle('show-file-in-folder', async (_event, filePath: string) => {
    try {
      logger.log('[IPC] Showing file in folder:', filePath)
      shell.showItemInFolder(filePath)
      return { success: true }
    } catch (error) {
      logger.error('[IPC] Failed to show file:', error)
      throw error
    }
  })
}
