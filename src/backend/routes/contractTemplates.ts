import { Router, Request, Response } from 'express'
import * as ContractTemplateModel from '../models/ContractTemplate'
import * as SettingsModel from '../models/Settings'
import type { ICreateContractTemplateDTO, IUpdateContractTemplateDTO } from '../types'
import fs from 'fs'
import path from 'path'

const router = Router()

/**
 * GET /api/contract-templates
 * Get all contract templates
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const templates = ContractTemplateModel.getAllTemplates()
    res.json(templates)
  } catch (error) {
    console.error('[ContractTemplates API] Error fetching templates:', error)
    res.status(500).json({ error: 'Failed to fetch contract templates' })
  }
})

/**
 * GET /api/contract-templates/:id
 * Get a single contract template by ID
 */
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10)

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid template ID' })
      return
    }

    const template = ContractTemplateModel.getTemplateById(id)

    if (!template) {
      res.status(404).json({ error: 'Contract template not found' })
      return
    }

    res.json(template)
  } catch (error) {
    console.error('[ContractTemplates API] Error fetching template:', error)
    res.status(500).json({ error: 'Failed to fetch contract template' })
  }
})

/**
 * POST /api/contract-templates
 * Create a new contract template
 */
router.post('/', (req: Request, res: Response): void => {
  try {
    const { title, type, filePath } = req.body as ICreateContractTemplateDTO

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'Title is required and must be a non-empty string' })
      return
    }

    if (!type || typeof type !== 'string' || type.trim().length === 0) {
      res.status(400).json({ error: 'Type is required and must be a non-empty string' })
      return
    }

    if (!filePath || typeof filePath !== 'string' || filePath.trim().length === 0) {
      res.status(400).json({ error: 'File path is required and must be a non-empty string' })
      return
    }

    // Check if file exists (resolve relative path)
    const settings = SettingsModel.getSettings()
    if (!settings || !settings.contract_templates_dir) {
      res.status(400).json({ error: 'Templates directory not configured in settings' })
      return
    }

    const absolutePath = path.resolve(settings.contract_templates_dir, filePath.trim())
    if (!fs.existsSync(absolutePath)) {
      res
        .status(400)
        .json({ error: `File does not exist: ${filePath.trim()} (resolved to ${absolutePath})` })
      return
    }

    const template = ContractTemplateModel.createTemplate({
      title: title.trim(),
      type: type.trim(),
      filePath: filePath.trim()
    })

    res.status(201).json(template)
  } catch (error) {
    console.error('[ContractTemplates API] Error creating template:', error)
    res.status(500).json({ error: 'Failed to create contract template' })
  }
})

/**
 * PUT /api/contract-templates/:id
 * Update an existing contract template
 */
router.put('/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10)

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid template ID' })
      return
    }

    const { title, type, filePath } = req.body as IUpdateContractTemplateDTO

    // Validation
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      res.status(400).json({ error: 'Title must be a non-empty string' })
      return
    }

    if (type !== undefined && (typeof type !== 'string' || type.trim().length === 0)) {
      res.status(400).json({ error: 'Type must be a non-empty string' })
      return
    }

    if (filePath !== undefined) {
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        res.status(400).json({ error: 'File path must be a non-empty string' })
        return
      }

      // Check if file exists (resolve relative path)
      const settings = SettingsModel.getSettings()
      if (!settings || !settings.contract_templates_dir) {
        res.status(400).json({ error: 'Templates directory not configured in settings' })
        return
      }

      const absolutePath = path.resolve(settings.contract_templates_dir, filePath.trim())
      if (!fs.existsSync(absolutePath)) {
        res
          .status(400)
          .json({ error: `File does not exist: ${filePath.trim()} (resolved to ${absolutePath})` })
        return
      }
    }

    const updateData: IUpdateContractTemplateDTO = {}
    if (title !== undefined) updateData.title = title.trim()
    if (type !== undefined) updateData.type = type.trim()
    if (filePath !== undefined) updateData.filePath = filePath.trim()

    const template = ContractTemplateModel.updateTemplate(id, updateData)

    if (!template) {
      res.status(404).json({ error: 'Contract template not found' })
      return
    }

    res.json(template)
  } catch (error) {
    console.error('[ContractTemplates API] Error updating template:', error)
    res.status(500).json({ error: 'Failed to update contract template' })
  }
})

/**
 * DELETE /api/contract-templates/:id
 * Delete a contract template
 */
router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10)

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid template ID' })
      return
    }

    const deleted = ContractTemplateModel.deleteTemplate(id)

    if (!deleted) {
      res.status(404).json({ error: 'Contract template not found' })
      return
    }

    res.status(204).send()
  } catch (error) {
    console.error('[ContractTemplates API] Error deleting template:', error)
    res.status(500).json({ error: 'Failed to delete contract template' })
  }
})

export default router
