/**
 * File Manager Types
 * Type definitions for cross-platform local file management
 */

export interface FileItem {
  name: string
  path: string
  relativePath: string
  type: 'file' | 'directory'
  size: number
  modified: number
  isHidden: boolean
  extension?: string
  icon?: string
}

export interface FileStats {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  modified: number
  created: number
  isHidden: boolean
}

export interface FileOperation {
  id: string
  type: 'copy' | 'move' | 'delete' | 'create'
  source?: string
  destination?: string
  progress: number
  total: number
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled'
  error?: string
}

export interface FileManagerError {
  code: string
  message: string
  path?: string
  details?: unknown
}

export interface ListOptions {
  showHidden: boolean
  sortBy?: 'name' | 'type' | 'size' | 'modified'
  sortDirection?: 'asc' | 'desc'
  searchQuery?: string
}

export interface CopyMoveOptions {
  overwrite?: boolean
  progressCallback?: (progress: number, total: number) => void
}

export interface DeleteOptions {
  toTrash: boolean
}

export interface RenameOptions {
  preserveExtension?: boolean
}

export interface RenameConflict {
  exists: boolean
  oldName: string
  newName: string
  path: string
}

export type ConflictResolution = 'overwrite' | 'keep-both' | 'cancel'

export interface RenameResult {
  success: boolean
  finalName?: string
  conflict?: RenameConflict
}

export interface UploadFile {
  name: string
  path: string
  size: number
  type: string
  file?: File
}

export interface UploadOptions {
  allowedTypes?: string[] | boolean
  maxSize?: number
  onConflict?: ConflictResolution | 'skip'
}

export interface UploadProgress {
  fileIndex: number
  fileName: string
  bytesTransferred: number
  totalBytes: number
  percent: number
  status: 'pending' | 'uploading' | 'complete' | 'error' | 'skipped'
  error?: string
}

export interface UploadResult {
  success: boolean
  uploaded: number
  skipped: number
  failed: number
  details: Array<{
    name: string
    status: 'success' | 'skipped' | 'error'
    error?: string
    finalPath?: string
  }>
}

export interface ValidationError {
  field: string
  message: string
  code: 'EMPTY_NAME' | 'INVALID_CHARS' | 'PATH_SEPARATOR' | 'EXTENSION_CHANGE' | 'TOO_LONG'
}

export interface FileManagerAPI {
  // Folder selection
  selectFolder: () => Promise<string | null>

  // File operations
  listFiles: (folderPath: string, options: ListOptions) => Promise<FileItem[]>
  createFolder: (parentPath: string, folderName: string) => Promise<void>
  rename: (oldPath: string, newName: string, options?: RenameOptions) => Promise<RenameResult>
  validateFileName: (name: string, oldName?: string) => Promise<ValidationError[]>
  resolveConflict: (path: string, name: string, resolution: ConflictResolution) => Promise<string>
  remove: (paths: string[], options: DeleteOptions) => Promise<void>
  copy: (sourcePaths: string[], destPath: string) => Promise<void>
  move: (sourcePaths: string[], destPath: string) => Promise<void>
  upload: (files: UploadFile[], destPath: string, options?: UploadOptions) => Promise<UploadResult>
  saveTempFile: (fileName: string, buffer: Uint8Array) => Promise<string>

  // System operations
  openInExplorer: (path: string) => Promise<void>
  openFile: (path: string) => Promise<void>

  // Path utilities
  joinPath: (...paths: string[]) => Promise<string>
  getParentPath: (path: string) => Promise<string>

  // Listeners
  onProgress: (callback: (operation: FileOperation) => void) => () => void
  onUploadProgress: (callback: (progress: UploadProgress) => void) => () => void
}

// Allowed file types for upload
export const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp'
] as const

export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp'
] as const

export interface BreadcrumbItem {
  name: string
  path: string
}

export type DragItem = {
  type: 'file' | 'folder'
  path: string
  name: string
}
