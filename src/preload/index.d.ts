import { ElectronAPI } from '@electron-toolkit/preload'
import {
  FileItem,
  ListOptions,
  DeleteOptions,
  FileOperation,
  RenameOptions,
  RenameResult,
  ValidationError,
  ConflictResolution,
  UploadFile,
  UploadOptions,
  UploadResult,
  UploadProgress,
  IContractTemplate
} from '../types'

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
    fileManager: {
      selectFolder: () => Promise<string | null>
      selectFile: (options?: {
        filters?: Array<{ name: string; extensions: string[] }>
      }) => Promise<string | null>
      setRootPath: (folderPath: string) => Promise<boolean>
      importFile: (
        externalFilePath: string,
        destPath: string,
        options?: { overwrite?: boolean; keepBoth?: boolean }
      ) => Promise<{ conflict: boolean; fileName: string }>
      listFiles: (folderPath: string, options: ListOptions) => Promise<FileItem[]>
      createFolder: (parentPath: string, folderName: string) => Promise<void>
      createFile: (filePath: string) => Promise<void>
      rename: (oldPath: string, newName: string, options?: RenameOptions) => Promise<RenameResult>
      validateFileName: (name: string, oldName?: string) => Promise<ValidationError[]>
      resolveConflict: (
        path: string,
        name: string,
        resolution: ConflictResolution
      ) => Promise<{ success: boolean; finalName?: string; cancelled?: boolean }>
      remove: (paths: string[], options: DeleteOptions) => Promise<void>
      copy: (
        sourcePaths: string[],
        destPath: string,
        options?: { keepBoth?: boolean }
      ) => Promise<string>
      move: (sourcePaths: string[], destPath: string) => Promise<void>
      upload: (
        files: UploadFile[],
        destPath: string,
        options?: UploadOptions
      ) => Promise<UploadResult>
      openInExplorer: (path: string) => Promise<void>
      openFile: (path: string) => Promise<void>
      joinPath: (...paths: string[]) => Promise<string>
      getParentPath: (path: string) => Promise<string>
      onProgress: (callback: (operation: FileOperation) => void) => () => void
      onUploadProgress: (callback: (progress: UploadProgress) => void) => () => void
      saveTempFile: (fileName: string, buffer: Uint8Array) => Promise<string>
    }
    database: {
      templates: {
        getAll: () => Promise<Array<IContractTemplate>>
        getById: (id: number) => Promise<IContractTemplate | null>
        getByPath: (filePath: string) => Promise<IContractTemplate | null>
        create: (data: {
          title: string
          type: string
          filePath: string
        }) => Promise<IContractTemplate>
        update: (
          id: number,
          data: { title?: string; type?: string; filePath?: string }
        ) => Promise<IContractTemplate | null>
        delete: (id: number) => Promise<boolean>
        getByType: (type: string) => Promise<Array<IContractTemplate>>
      }
      settings: {
        get: () => Promise<{
          id: number
          contract_templates_dir: string | null
          generated_contracts_dir: string | null
          updated_at: string
        } | null>
        update: (data: {
          contractTemplatesDir?: string | null
          generatedContractsDir?: string | null
        }) => Promise<{
          id: number
          contract_templates_dir: string | null
          generated_contracts_dir: string | null
          updated_at: string
        }>
        reset: () => Promise<{
          id: number
          contract_templates_dir: string | null
          generated_contracts_dir: string | null
          updated_at: string
        }>
      }
    }
  }
}
