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
  },

  // Backend API URL
  getBackendUrl: () => ipcRenderer.invoke('backend:get-url')
}

// ---- File Manager API ----
const fileManagerAPI = {
  // Folder selection
  selectFolder: () => ipcRenderer.invoke('fileManager:selectFolder'),
  selectFile: (options?: { filters?: any[] }) =>
    ipcRenderer.invoke('fileManager:selectFile', options),
  setRootPath: (folderPath: string) => ipcRenderer.invoke('fileManager:setRootPath', folderPath),
  importFile: (
    externalFilePath: string,
    destPath: string,
    options?: { overwrite?: boolean; keepBoth?: boolean }
  ) => ipcRenderer.invoke('fileManager:importFile', externalFilePath, destPath, options),

  // File operations
  listFiles: (folderPath: string, options: any) =>
    ipcRenderer.invoke('fileManager:listFiles', folderPath, options),
  createFolder: (parentPath: string, folderName: string) =>
    ipcRenderer.invoke('fileManager:createFolder', parentPath, folderName),
  createFile: (filePath: string) => ipcRenderer.invoke('fileManager:createFile', filePath),
  rename: (oldPath: string, newName: string, options?: any) =>
    ipcRenderer.invoke('fileManager:rename', oldPath, newName, options),
  validateFileName: (name: string, oldName?: string) =>
    ipcRenderer.invoke('fileManager:validateFileName', name, oldName),
  resolveConflict: (path: string, name: string, resolution: string) =>
    ipcRenderer.invoke('fileManager:resolveConflict', path, name, resolution),
  remove: (paths: string[], options: any) =>
    ipcRenderer.invoke('fileManager:remove', paths, options),
  copy: (sourcePaths: string[], destPath: string, options?: { keepBoth?: boolean }) =>
    ipcRenderer.invoke('fileManager:copy', sourcePaths, destPath, options),
  move: (sourcePaths: string[], destPath: string) =>
    ipcRenderer.invoke('fileManager:move', sourcePaths, destPath),
  upload: (files: any[], destPath: string, options?: any) =>
    ipcRenderer.invoke('fileManager:upload', files, destPath, options),
  saveTempFile: (fileName: string, buffer: Uint8Array) =>
    ipcRenderer.invoke('fileManager:saveTempFile', fileName, buffer),

  // System operations
  openInExplorer: (path: string) => ipcRenderer.invoke('fileManager:openInExplorer', path),
  openFile: (path: string) => ipcRenderer.invoke('fileManager:openFile', path),

  // Path utilities
  joinPath: (...paths: string[]) => ipcRenderer.invoke('fileManager:joinPath', ...paths),
  getParentPath: (path: string) => ipcRenderer.invoke('fileManager:getParentPath', path),

  // Progress listeners
  onProgress: (callback: (operation: any) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, operation: any): void => callback(operation)
    ipcRenderer.on('fileManager:progress', handler)
    return () => ipcRenderer.removeListener('fileManager:progress', handler)
  },
  onUploadProgress: (callback: (progress: any) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, progress: any): void => callback(progress)
    ipcRenderer.on('fileManager:uploadProgress', handler)
    return () => ipcRenderer.removeListener('fileManager:uploadProgress', handler)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('fileManager', fileManagerAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.fileManager = fileManagerAPI
}
