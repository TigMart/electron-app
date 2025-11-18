import api from '@/lib/axios'
import type { ISettings, IUpdateSettingsDTO } from '../../../backend/types'

export async function getSettings(): Promise<ISettings> {
  const response = await api.get<ISettings>('/api/settings')
  return response.data
}

export async function updateSettings(data: IUpdateSettingsDTO): Promise<ISettings> {
  const response = await api.put<ISettings>('/api/settings', data)
  return response.data
}

export async function resetSettings(): Promise<void> {
  await api.delete('/api/settings')
}
