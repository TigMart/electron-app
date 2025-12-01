import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import fs from 'fs/promises'
import path from 'path'
import { logger } from '../utils/logger'

/**
 * Generate a DOCX file from a template with data placeholders
 * @param templatePath - Path to the template DOCX file
 * @param data - JSON data to fill in placeholders
 * @param outputPath - Path where the generated DOCX will be saved
 * @returns The path to the generated file
 */
export async function generateDocxFromTemplate(
  templatePath: string,
  data: Record<string, unknown>,
  outputPath: string
): Promise<string> {
  try {
    logger.log('[DOCX Generator] Starting generation...')
    logger.log('[DOCX Generator] Template:', templatePath)
    logger.log('[DOCX Generator] Output:', outputPath)

    // 1. Read the template file
    const content = await fs.readFile(templatePath, 'binary')
    logger.log('[DOCX Generator] Template file read successfully')

    // 2. Create a PizZip instance with the content
    const zip = new PizZip(content)

    // 3. Create a docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    })

    // 4. Render the document (fill in placeholders)
    logger.log('[DOCX Generator] Rendering with data:', JSON.stringify(data, null, 2))
    doc.render(data)

    // 5. Generate the output as a buffer
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    })

    // 6. Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true })

    // 7. Write the buffer to the output file
    await fs.writeFile(outputPath, buffer)

    logger.log('[DOCX Generator] Document generated successfully:', outputPath)
    return outputPath
  } catch (error) {
    logger.error('[DOCX Generator] Error generating document:', error)

    // Provide helpful error messages
    if (error && typeof error === 'object' && 'properties' in error) {
      const docxError = error as {
        properties?: { errors?: Array<{ name: string; message: string }> }
      }
      if (docxError.properties?.errors) {
        const errorMessages = docxError.properties.errors
          .map((err) => `${err.name}: ${err.message}`)
          .join(', ')
        throw new Error(`Template error: ${errorMessages}`)
      }
    }

    throw error
  }
}

/**
 * Validate that a template file exists and is readable
 * @param templatePath - Path to the template file
 * @returns true if valid, throws error otherwise
 */
export async function validateTemplate(templatePath: string): Promise<boolean> {
  try {
    await fs.access(templatePath)
    const stats = await fs.stat(templatePath)

    if (!stats.isFile()) {
      throw new Error('Template path is not a file')
    }

    if (path.extname(templatePath).toLowerCase() !== '.docx') {
      throw new Error('Template must be a .docx file')
    }

    return true
  } catch (error) {
    logger.error('[DOCX Generator] Template validation failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Invalid template: ${errorMessage}`)
  }
}
