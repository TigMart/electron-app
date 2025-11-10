/* eslint-disable @typescript-eslint/no-explicit-any */
import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ipcRenderer } from 'electron'

// Custom APIs for renderer
// ---- Custom API exposed to the renderer ----
const api = {
  // Manually trigger an update check (optional)
  checkForUpdates: () => ipcRenderer.invoke('updater:check-now'),

  onUpdaterStatus: (
    callback: (payload: {
      state: 'checking' | 'available' | 'idle' | 'error' | 'downloaded'
      info?: unknown
      message?: string
    }) => void
  ) => {
    const handler = (_e: Electron.IpcRendererEvent, payload: any): void => callback(payload)
    ipcRenderer.on('updater:status', handler)
    return () => ipcRenderer.removeListener('updater:status', handler)
  },

  // Subscribe to download progress (percent, bytes/sec, etc.)
  onUpdaterProgress: (
    callback: (p: {
      percent: number
      transferred: number
      total: number
      bytesPerSecond: number
    }) => void
  ) => {
    const handler = (_e: Electron.IpcRendererEvent, payload: any): void => callback(payload)
    ipcRenderer.on('updater:progress', handler)
    return () => ipcRenderer.removeListener('updater:progress', handler)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
