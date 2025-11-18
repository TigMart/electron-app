import { Router, Request, Response } from 'express'
import * as SettingsModel from '../models/Settings'
import type { IUpdateSettingsDTO } from '../types'

const router = Router()

/**
 * GET /api/settings
 * Get application settings
 */
router.get('/', (_req: Request, res: Response): void => {
  try {
    const settings = SettingsModel.getSettings()

    if (!settings) {
      // Return default settings if none exist
      res.json({
        id: 1,
        default_contract_directory: null,
        default_template_directory: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      return
    }

    res.json(settings)
  } catch (error) {
    console.error('[Settings API] Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

/**
 * PUT /api/settings
 * Update application settings
 */
router.put('/', (req: Request, res: Response): void => {
  try {
    const { contractTemplatesDir, generatedContractsDir } = req.body as IUpdateSettingsDTO

    // Validation
    if (
      contractTemplatesDir !== undefined &&
      contractTemplatesDir !== null &&
      (typeof contractTemplatesDir !== 'string' || contractTemplatesDir.trim().length === 0)
    ) {
      res
        .status(400)
        .json({ error: 'Contract templates directory must be a non-empty string or null' })
      return
    }

    if (
      generatedContractsDir !== undefined &&
      generatedContractsDir !== null &&
      (typeof generatedContractsDir !== 'string' || generatedContractsDir.trim().length === 0)
    ) {
      res
        .status(400)
        .json({ error: 'Generated contracts directory must be a non-empty string or null' })
      return
    }

    const updateData: IUpdateSettingsDTO = {}
    if (contractTemplatesDir !== undefined) {
      updateData.contractTemplatesDir = contractTemplatesDir ? contractTemplatesDir.trim() : null
    }
    if (generatedContractsDir !== undefined) {
      updateData.generatedContractsDir = generatedContractsDir ? generatedContractsDir.trim() : null
    }

    const settings = SettingsModel.updateSettings(updateData)
    res.json(settings)
  } catch (error) {
    console.error('[Settings API] Error updating settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

/**
 * DELETE /api/settings
 * Reset settings to defaults
 */
router.delete('/', (_req: Request, res: Response) => {
  try {
    SettingsModel.resetSettings()
    res.status(204).send()
  } catch (error) {
    console.error('[Settings API] Error resetting settings:', error)
    res.status(500).json({ error: 'Failed to reset settings' })
  }
})

export default router
