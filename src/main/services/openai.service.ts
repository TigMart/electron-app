/**
 * OpenAI Service for Contract Data Generation
 * 
 * This service uses OpenAI GPT-4 Turbo for intelligent contract data generation.
 * It helps fill template placeholders by analyzing user-provided JSON data
 * and performing smart field mapping and formatting.
 */

import OpenAI from 'openai'
import { logger } from '../utils/logger'
import fs from 'fs/promises'

// Initialize OpenAI client (will be set later)
let openai: OpenAI

// Initialize the client - called after env is loaded
function initializeOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY
    logger.log('[OpenAI Service - Contract Generation] Initializing with API key:', apiKey ? '✓ Present' : '✗ Missing')
    logger.log('[OpenAI Service - Contract Generation] API key length:', apiKey?.length || 0)

    if (!apiKey) {
      logger.error('[OpenAI Service - Contract Generation] ERROR: OPENAI_API_KEY is not set!')
    }

    openai = new OpenAI({
      apiKey: apiKey || ''
    })
  }
  return openai
}

/**
 * Hardcoded system prompt for contract generation
 */
const SYSTEM_PROMPT = `You are a professional contract generation assistant. Your task is to intelligently fill contract templates with provided data.

IMPORTANT RULES:
1. You will receive a template structure with placeholders like {fieldName}
2. You will receive JSON data with values
3. Your job is to return ONLY a JSON object with the filled values for each placeholder
4. Do NOT generate full contract text - just return the filled data
5. Be smart: if a field is missing, infer it from context or use reasonable defaults
6. Keep the same field names as the template placeholders
7. Format dates nicely, add currency symbols, expand abbreviations, etc.

Example:
Template has: {clientName}, {startDate}, {monthlyFee}
User provides: { "client": "John Doe", "start": "2025-01-01", "fee": "2000" }
You return: { "clientName": "John Doe", "startDate": "January 1, 2025", "monthlyFee": "2,000 EUR" }
`

/**
 * Use OpenAI to intelligently fill template placeholders
 * @param templateContent - The template content (text fromDOCX)
 * @param userJsonData - Raw JSON data from user
 * @param templatePlaceholders - List of placeholders found in template
 * @returns Filled data ready for docxtemplater
 */
export async function generateContractDataWithAI(
  templateContent: string,
  userJsonData: Record<string, unknown>,
  templatePlaceholders: string[]
): Promise<Record<string, unknown>> {
  try {
    // Initialize OpenAI client if not already done
    initializeOpenAI()

    logger.log('[OpenAI] Generating contract data...')
    logger.log('[OpenAI] Template placeholders:', templatePlaceholders)
    logger.log('[OpenAI] User data:', userJsonData)

    const userPrompt = `Template has these placeholders: ${templatePlaceholders.join(', ')}

User provided this data:
${JSON.stringify(userJsonData, null, 2)}

Template excerpt:
${templateContent.substring(0, 500)}...

Generate a JSON object with appropriate values for each placeholder. Be smart about matching fields and formatting.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const filledData = JSON.parse(content)
    logger.log('[OpenAI] Generated data:', filledData)

    return filledData
  } catch (error) {
    logger.error('[OpenAI] Error:', error)
    throw error
  }
}

/**
 * Extract text content from DOCX buffer
 * This is a simple extraction - just gets text for AI context
 */
export async function extractDocxText(filePath: string): Promise<string> {
  try {
    // For now, just read file info
    // In production, you'd use a proper DOCX parser
    const stats = await fs.stat(filePath)
    return `[DOCX Template File: ${filePath}, Size: ${stats.size} bytes]`
  } catch (error) {
    logger.error('[DOCX Text Extract] Error:', error)
    return '[Template content unavailable]'
  }
}

/**
 * Extract placeholder names from DOCX template
 * Finds all {{placeholderName}} patterns
 */
export function extractPlaceholders(templateText: string): string[] {
  const regex = /\{(\w+)\}/g
  const placeholders: string[] = []
  let match

  while ((match = regex.exec(templateText)) !== null) {
    if (!placeholders.includes(match[1])) {
      placeholders.push(match[1])
    }
  }

  logger.log('[Placeholder Extract] Found:', placeholders)
  return placeholders
}
