import type { ISettings, IUpdateSettingsDTO } from '../../../types'

export async function getSettings(): Promise<ISettings> {
  const settings = await window.database.settings.get()
  if (!settings) {
    throw new Error('Settings not found')
  }
  return settings
}

export async function updateSettings(data: IUpdateSettingsDTO): Promise<ISettings> {
  return window.database.settings.update(data)
}

export async function resetSettings(): Promise<ISettings> {
  return window.database.settings.reset()
}
