import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      checkForUpdates: () => Promise<{ version: string | null }>
      onUpdaterStatus: (
        cb: (payload: {
          state: 'checking' | 'available' | 'idle' | 'error' | 'downloaded'
          info?: unknown
          message?: string
        }) => void
      ) => () => void
      onUpdaterProgress: (
        cb: (p: {
          percent: number
          transferred: number
          total: number
          bytesPerSecond: number
        }) => void
      ) => () => void
    }
  }
}
