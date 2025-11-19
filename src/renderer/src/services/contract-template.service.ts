import type {
  IContractTemplate,
  ICreateContractTemplateDTO,
  IUpdateContractTemplateDTO
} from '../../../types'

export async function getAllTemplates(): Promise<IContractTemplate[]> {
  return window.database.templates.getAll()
}

export async function getTemplateById(id: number): Promise<IContractTemplate> {
  const template = await window.database.templates.getById(id)
  if (!template) {
    throw new Error(`Template with id ${id} not found`)
  }
  return template
}

export async function getTemplateByFilePath(filePath: string): Promise<IContractTemplate | null> {
  const template = await window.database.templates.getByPath(filePath)
  if (!template) {
    throw new Error(`Template with file path ${filePath} not found`)
  }
  return template
}

export async function createTemplate(data: ICreateContractTemplateDTO): Promise<IContractTemplate> {
  return window.database.templates.create(data)
}

export async function updateTemplate(
  id: number,
  data: IUpdateContractTemplateDTO
): Promise<IContractTemplate> {
  const result = await window.database.templates.update(id, data)
  if (!result) {
    throw new Error(`Template with id ${id} not found`)
  }
  return result
}

export async function deleteTemplate(id: number): Promise<void> {
  const success = await window.database.templates.delete(id)
  if (!success) {
    throw new Error(`Failed to delete template with id ${id}`)
  }
}
