import api from '@/lib/axios'
import type {
  IContractTemplate,
  ICreateContractTemplateDTO,
  IUpdateContractTemplateDTO
} from '../../../backend/types'

export async function getAllTemplates(): Promise<IContractTemplate[]> {
  const response = await api.get<IContractTemplate[]>('/api/contract-templates')
  return response.data
}

export async function getTemplateById(id: number): Promise<IContractTemplate> {
  const response = await api.get<IContractTemplate>(`/api/contract-templates/${id}`)
  return response.data
}

export async function getTemplateByFilePath(filePath: string): Promise<IContractTemplate | null> {
  try {
    const templates = await getAllTemplates()
    return templates.find((t) => t.file_path === filePath) || null
  } catch (error) {
    console.error('Failed to get template by file path:', error)
    return null
  }
}

export async function createTemplate(data: ICreateContractTemplateDTO): Promise<IContractTemplate> {
  const response = await api.post<IContractTemplate>('/api/contract-templates', data)
  return response.data
}

export async function updateTemplate(
  id: number,
  data: IUpdateContractTemplateDTO
): Promise<IContractTemplate> {
  const response = await api.put<IContractTemplate>(`/api/contract-templates/${id}`, data)
  return response.data
}

export async function deleteTemplate(id: number): Promise<void> {
  await api.delete(`/api/contract-templates/${id}`)
}
