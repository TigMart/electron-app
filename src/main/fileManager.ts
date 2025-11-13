/* eslint-disable no-control-regex */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * File Manager - Main Process Handlers
 * Secure filesystem operations with path validation and root scoping
 */

import { ipcMain, dialog, shell, BrowserWindow, app } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'

interface FileItem {
  name: string
  path: string
  relativePath: string
  type: 'file' | 'directory'
  size: number
  modified: number
  isHidden: boolean
  extension?: string
}

interface ListOptions {
  showHidden: boolean
  sortBy?: 'name' | 'type' | 'size' | 'modified'
  sortDirection?: 'asc' | 'desc'
  searchQuery?: string
}

// Store the current root path per window
const rootPaths = new Map<number, string>()

/**
 * Normalize and validate path is within root
 */
function validatePath(rootPath: string, targetPath: string): string {
  const normalized = path.normalize(targetPath)
  const resolved = path.resolve(normalized)
  const root = path.resolve(rootPath)

  if (!resolved.startsWith(root)) {
    throw new Error('Path traversal attempt detected')
  }

  return resolved
}

/**
 * Check if file/folder name starts with dot (hidden)
 */
function isHidden(name: string): boolean {
  // Dot files are hidden on all platforms
  if (name.startsWith('.')) return true

  // On Windows, check hidden attribute (best effort)
  if (process.platform === 'win32') {
    try {
      // This is a simplified check; proper implementation would use native modules
      // For now, just rely on dot files
      return false
    } catch {
      return false
    }
  }

  return false
}

/**
 * Get file extension
 */
function getExtension(fileName: string): string | undefined {
  const ext = path.extname(fileName)
  return ext ? ext.substring(1).toLowerCase() : undefined
}

/**
 * Validation error interface
 */
interface ValidationError {
  field: string
  message: string
  code: string
}

/**
 * Allowed file types for upload
 */
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'gif', 'webp'] as const

/**
 * Validate filename synchronously
 * Returns array of validation errors
 */
function validateFileNameSync(name: string, oldName?: string): ValidationError[] {
  const errors: ValidationError[] = []

  // Skip validation if name hasn't changed
  if (oldName && name === oldName) {
    return errors
  }

  // Check empty
  if (!name || name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Filename cannot be empty',
      code: 'EMPTY_NAME'
    })
    return errors
  }

  // Check length
  if (name.length > 255) {
    errors.push({
      field: 'name',
      message: 'Filename is too long (max 255 characters)',
      code: 'NAME_TOO_LONG'
    })
  }

  // Check for path separators
  if (name.includes('/') || name.includes('\\')) {
    errors.push({
      field: 'name',
      message: 'Filename cannot contain / or \\',
      code: 'INVALID_PATH_SEPARATOR'
    })
  }

  // Check for special characters (Windows reserved)
  const invalidChars = /[<>:"|?*\x00-\x1F]/
  if (invalidChars.test(name)) {
    errors.push({
      field: 'name',
      message: 'Filename contains invalid characters',
      code: 'INVALID_CHARACTERS'
    })
  }

  // Check for reserved names (Windows)
  const reservedNames = [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9'
  ]
  const nameWithoutExt = path.parse(name).name.toUpperCase()
  if (reservedNames.includes(nameWithoutExt)) {
    errors.push({
      field: 'name',
      message: `"${name}" is a reserved system name`,
      code: 'RESERVED_NAME'
    })
  }

  return errors
}

/**
 * Generate unique filename by adding (1), (2), etc.
 */
async function generateUniqueFileName(dirPath: string, desiredName: string): Promise<string> {
  const parsed = path.parse(desiredName)
  let counter = 1
  let newName = desiredName

  while (true) {
    try {
      await fs.access(path.join(dirPath, newName))
      // File exists, try next number
      newName = `${parsed.name} (${counter})${parsed.ext}`
      counter++
    } catch {
      // File doesn't exist, we can use this name
      return newName
    }
  }
}

/**
 * Check if file extension is allowed for upload
 */
function isAllowedFileType(fileName: string): boolean {
  const ext = getExtension(fileName)
  if (!ext) return false
  return ALLOWED_EXTENSIONS.includes(ext as any)
}

/**
 * Setup all file manager IPC handlers
 */
export function setupFileManagerHandlers(): void {
  try {
    console.log('[FileManager] Setting up IPC handlers...')

    // Select folder dialog
    ipcMain.handle('fileManager:selectFolder', async (event) => {
      console.log('[FileManager] selectFolder handler called')
      const window = BrowserWindow.fromWebContents(event.sender)

      if (!window) {
        throw new Error('Could not find browser window')
      }

      const result = await dialog.showOpenDialog(window, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Folder'
      })

      if (result.canceled || !result.filePaths[0]) {
        return null
      }

      const selectedPath = result.filePaths[0]
      const windowId = window.id

      rootPaths.set(windowId, selectedPath)
      console.log('[FileManager] Root path set:', selectedPath, 'for window:', windowId)

      return selectedPath
    })

    console.log('[FileManager] selectFolder handler registered')

    // List files in directory
    ipcMain.handle(
      'fileManager:listFiles',
      async (event, folderPath: string, options: ListOptions) => {
        const windowId = BrowserWindow.fromWebContents(event.sender)?.id
        const rootPath = windowId ? rootPaths.get(windowId) : null

        if (!rootPath) {
          throw new Error('No root folder selected')
        }

        const validatedPath = validatePath(rootPath, folderPath)

        const entries = await fs.readdir(validatedPath, { withFileTypes: true })
        const items: FileItem[] = []

        for (const entry of entries) {
          const entryPath = path.join(validatedPath, entry.name)
          const hidden = isHidden(entry.name)

          // Skip hidden files if not showing them
          if (hidden && !options.showHidden) continue

          // Search filter
          if (
            options.searchQuery &&
            !entry.name.toLowerCase().includes(options.searchQuery.toLowerCase())
          ) {
            continue
          }

          try {
            const stats = await fs.stat(entryPath)

            const item: FileItem = {
              name: entry.name,
              path: entryPath,
              relativePath: path.relative(rootPath, entryPath),
              type: entry.isDirectory() ? 'directory' : 'file',
              size: stats.size,
              modified: stats.mtimeMs,
              isHidden: hidden,
              extension: entry.isFile() ? getExtension(entry.name) : undefined
            }

            items.push(item)
          } catch (error) {
            // Skip files we can't read
            console.error(`Error reading ${entryPath}:`, error)
          }
        }

        // Sort items
        if (options.sortBy) {
          items.sort((a, b) => {
            let aVal: any = a[options.sortBy!]
            let bVal: any = b[options.sortBy!]

            // Directories first
            if (a.type === 'directory' && b.type === 'file') return -1
            if (a.type === 'file' && b.type === 'directory') return 1

            if (options.sortBy === 'name') {
              aVal = aVal.toLowerCase()
              bVal = bVal.toLowerCase()
            }

            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
            return options.sortDirection === 'desc' ? -comparison : comparison
          })
        }

        return items
      }
    )

    // Create folder
    ipcMain.handle(
      'fileManager:createFolder',
      async (event, parentPath: string, folderName: string) => {
        console.log('[DEBUG] IPC createFolder called:', parentPath, folderName)
        const windowId = BrowserWindow.fromWebContents(event.sender)?.id
        const rootPath = windowId ? rootPaths.get(windowId) : null

        if (!rootPath) {
          console.error('[DEBUG] No root path for window:', windowId)
          throw new Error('No root folder selected')
        }

        // Validate folder name
        if (!folderName || folderName.includes('/') || folderName.includes('\\')) {
          console.error('[DEBUG] Invalid folder name:', folderName)
          throw new Error('Invalid folder name')
        }

        const validatedParent = validatePath(rootPath, parentPath)
        const newFolderPath = path.join(validatedParent, folderName)
        console.log('[DEBUG] Creating folder at:', newFolderPath)

        // Check if already exists
        try {
          await fs.access(newFolderPath)
          console.error('[DEBUG] Folder already exists:', newFolderPath)
          throw new Error('Folder already exists')
        } catch (error: any) {
          if (error.code !== 'ENOENT') throw error
        }

        await fs.mkdir(newFolderPath, { recursive: false })
        console.log('[DEBUG] Folder created successfully')
      }
    )

    // Validate filename
    ipcMain.handle(
      'fileManager:validateFileName',
      async (_event, name: string, oldName?: string) => {
        return validateFileNameSync(name, oldName)
      }
    )

    // Rename file/folder (enhanced with conflict detection)
    ipcMain.handle(
      'fileManager:rename',
      async (event, oldPath: string, newName: string, options?: any) => {
        const windowId = BrowserWindow.fromWebContents(event.sender)?.id
        const rootPath = windowId ? rootPaths.get(windowId) : null

        if (!rootPath) {
          throw new Error('No root folder selected')
        }

        const validatedOldPath = validatePath(rootPath, oldPath)
        const oldFileName = path.basename(validatedOldPath)

        // Validate new name
        const errors = validateFileNameSync(newName, oldFileName)
        if (errors.length > 0) {
          throw new Error(errors[0].message)
        }

        // Handle extension preservation
        const preserveExtension = options?.preserveExtension !== false
        let finalName = newName

        if (preserveExtension) {
          const oldExt = path.extname(oldFileName)
          const newExt = path.extname(newName)

          // If new name doesn't have extension but old one does, preserve it
          if (oldExt && !newExt) {
            finalName = newName + oldExt
          }
        }

        const parentDir = path.dirname(validatedOldPath)
        const newPath = path.join(parentDir, finalName)

        // Ensure new path is within root
        validatePath(rootPath, newPath)

        // Check for conflict
        try {
          await fs.access(newPath)
          // File exists - return conflict
          return {
            success: false,
            conflict: {
              exists: true,
              oldName: oldFileName,
              newName: finalName,
              path: parentDir
            }
          }
        } catch {
          // File doesn't exist, proceed with rename
          await fs.rename(validatedOldPath, newPath)
          return {
            success: true,
            finalName
          }
        }
      }
    )

    // Resolve rename conflict
    ipcMain.handle(
      'fileManager:resolveConflict',
      async (event, targetPath: string, desiredName: string, resolution: string) => {
        const windowId = BrowserWindow.fromWebContents(event.sender)?.id
        const rootPath = windowId ? rootPaths.get(windowId) : null

        if (!rootPath) {
          throw new Error('No root folder selected')
        }

        const validatedPath = validatePath(rootPath, targetPath)

        if (resolution === 'cancel') {
          return { success: false, cancelled: true }
        }

        if (resolution === 'overwrite') {
          // Delete existing file
          const destPath = path.join(validatedPath, desiredName)
          validatePath(rootPath, destPath)
          try {
            await fs.unlink(destPath)
          } catch {
            // Ignore if doesn't exist
          }
          return { success: true, finalName: desiredName }
        }

        if (resolution === 'keep-both') {
          // Generate unique name
          const uniqueName = await generateUniqueFileName(validatedPath, desiredName)
          return { success: true, finalName: uniqueName }
        }

        throw new Error('Invalid conflict resolution')
      }
    )

    // Save temporary file for uploads
    ipcMain.handle(
      'fileManager:saveTempFile',
      async (_event, fileName: string, buffer: Uint8Array) => {
        console.log('[DEBUG] Saving temp file:', fileName)
        const tmpDir = app.getPath('temp')
        const tempPath = path.join(tmpDir, `electron-upload-${Date.now()}-${fileName}`)

        await fs.writeFile(tempPath, buffer)
        console.log('[DEBUG] Temp file saved to:', tempPath)

        return tempPath
      }
    )

    // Upload files with progress
    ipcMain.handle(
      'fileManager:upload',
      async (event, files: any[], destPath: string, options?: any) => {
        console.log(
          '[DEBUG] IPC upload called, files:',
          files.length,
          'destPath:',
          destPath,
          'options:',
          options
        )
        const windowId = BrowserWindow.fromWebContents(event.sender)?.id
        const rootPath = windowId ? rootPaths.get(windowId) : null

        if (!rootPath) {
          console.error('[DEBUG] No root path for window:', windowId)
          throw new Error('No root folder selected')
        }

        const validatedDest = validatePath(rootPath, destPath)
        console.log('[DEBUG] Validated destination:', validatedDest)
        const results = {
          success: true,
          uploaded: [] as string[],
          skipped: [] as string[],
          failed: [] as Array<{ file: string; error: string }>,
          details: [] as any[]
        }

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          // Use file.name which is the original name, not the path basename (which might be temp)
          const fileName = file.name
          console.log('[DEBUG] Processing file', i + 1, 'of', files.length, ':', fileName)
          console.log('[DEBUG] File object:', JSON.stringify(file, null, 2))

          // Validate file type if allowlist provided
          if (options?.allowedTypes !== false && !isAllowedFileType(fileName)) {
            console.log('[DEBUG] File type not allowed:', fileName)
            results.skipped.push(fileName)
            results.details.push({
              file: fileName,
              status: 'skipped',
              reason: 'File type not allowed'
            })
            continue
          }

          try {
            const targetPath = path.join(validatedDest, fileName)
            console.log('[DEBUG] Source path:', file.path)
            console.log('[DEBUG] Target path:', targetPath)

            // Check if source file exists
            try {
              await fs.access(file.path)
              console.log('[DEBUG] Source file exists')
            } catch {
              console.error('[DEBUG] Source file does not exist:', file.path)
              throw new Error(`Source file not found: ${file.path}`)
            }

            validatePath(rootPath, targetPath)

            // Check for conflict
            let finalPath = targetPath
            let finalName = fileName
            try {
              await fs.access(targetPath)
              // File exists - handle conflict
              const onConflict = options?.onConflict || 'skip'

              if (onConflict === 'skip') {
                results.skipped.push(fileName)
                results.details.push({
                  file: fileName,
                  status: 'skipped',
                  reason: 'File already exists'
                })
                continue
              } else if (onConflict === 'keep-both') {
                finalName = await generateUniqueFileName(validatedDest, fileName)
                finalPath = path.join(validatedDest, finalName)
              }
              // 'overwrite' will just proceed with copy
            } catch {
              // File doesn't exist, continue
            }

            // Copy file with progress events
            const stats = await fs.stat(file.path)
            const totalBytes = stats.size

            // Send progress start
            event.sender.send('fileManager:uploadProgress', {
              fileIndex: i,
              fileName,
              bytesTransferred: 0,
              totalBytes,
              percent: 0,
              status: 'uploading'
            })

            // Copy file
            await fs.copyFile(file.path, finalPath)

            // Send progress complete
            event.sender.send('fileManager:uploadProgress', {
              fileIndex: i,
              fileName,
              bytesTransferred: totalBytes,
              totalBytes,
              percent: 100,
              status: 'complete'
            })

            results.uploaded.push(finalName)
            results.details.push({
              file: fileName,
              finalName,
              status: 'uploaded'
            })
          } catch (error: any) {
            results.failed.push({
              file: fileName,
              error: error.message
            })
            results.details.push({
              file: fileName,
              status: 'failed',
              error: error.message
            })

            // Send error progress
            event.sender.send('fileManager:uploadProgress', {
              fileIndex: i,
              fileName,
              status: 'error',
              error: error.message
            })
          }
        }

        results.success = results.failed.length === 0

        return {
          success: results.success,
          uploaded: results.uploaded.length,
          skipped: results.skipped.length,
          failed: results.failed.length,
          details: results.details
        }
      }
    )

    // Delete files/folders
    ipcMain.handle(
      'fileManager:remove',
      async (event, paths: string[], options: { toTrash: boolean }) => {
        console.log('[DEBUG] IPC remove called:', paths, options)
        const windowId = BrowserWindow.fromWebContents(event.sender)?.id
        const rootPath = windowId ? rootPaths.get(windowId) : null

        if (!rootPath) {
          console.error('[DEBUG] No root path for window:', windowId)
          throw new Error('No root folder selected')
        }

        for (const targetPath of paths) {
          const validatedPath = validatePath(rootPath, targetPath)
          console.log('[DEBUG] Removing:', validatedPath, 'toTrash:', options.toTrash)

          if (options.toTrash) {
            // Use shell.trashItem for safe deletion
            await shell.trashItem(validatedPath)
          } else {
            // Permanent deletion
            const stats = await fs.stat(validatedPath)
            if (stats.isDirectory()) {
              await fs.rm(validatedPath, { recursive: true, force: true })
            } else {
              await fs.unlink(validatedPath)
            }
          }
          console.log('[DEBUG] Removed successfully:', validatedPath)
        }
        console.log('[DEBUG] All items removed')
      }
    )

    // Copy files/folders
    ipcMain.handle('fileManager:copy', async (event, sourcePaths: string[], destPath: string) => {
      console.log('[DEBUG] IPC copy called:', sourcePaths, 'to', destPath)
      const windowId = BrowserWindow.fromWebContents(event.sender)?.id
      const rootPath = windowId ? rootPaths.get(windowId) : null

      if (!rootPath) {
        console.error('[DEBUG] No root path for window:', windowId)
        throw new Error('No root folder selected')
      }

      const validatedDest = validatePath(rootPath, destPath)

      for (const sourcePath of sourcePaths) {
        const validatedSource = validatePath(rootPath, sourcePath)
        const fileName = path.basename(validatedSource)
        let targetPath = path.join(validatedDest, fileName)
        console.log('[DEBUG] Copying:', validatedSource, 'to', targetPath)

        // Check if target already exists, generate unique name if needed
        if (await fs.stat(targetPath).catch(() => null)) {
          const ext = path.extname(fileName)
          const baseName = ext ? fileName.slice(0, -ext.length) : fileName

          let counter = 1
          let newFileName = `${baseName} - Copy${ext}`
          targetPath = path.join(validatedDest, newFileName)

          // Keep trying until we find a unique name
          while (await fs.stat(targetPath).catch(() => null)) {
            counter++
            newFileName = `${baseName} - Copy ${counter}${ext}`
            targetPath = path.join(validatedDest, newFileName)
          }

          console.log('[DEBUG] Target exists, using unique name:', newFileName)
        }

        // Validate target is in root
        validatePath(rootPath, targetPath)

        await copyRecursive(validatedSource, targetPath)
        console.log('[DEBUG] Copied successfully')
      }
      console.log('[DEBUG] All items copied')
    })

    // Move files/folders
    ipcMain.handle('fileManager:move', async (event, sourcePaths: string[], destPath: string) => {
      console.log('[DEBUG] IPC move called:', sourcePaths, 'to', destPath)
      const windowId = BrowserWindow.fromWebContents(event.sender)?.id
      const rootPath = windowId ? rootPaths.get(windowId) : null

      if (!rootPath) {
        console.error('[DEBUG] No root path for window:', windowId)
        throw new Error('No root folder selected')
      }

      const validatedDest = validatePath(rootPath, destPath)

      for (const sourcePath of sourcePaths) {
        const validatedSource = validatePath(rootPath, sourcePath)
        const fileName = path.basename(validatedSource)
        const targetPath = path.join(validatedDest, fileName)
        console.log('[DEBUG] Moving:', validatedSource, 'to', targetPath)

        // Validate target is in root
        validatePath(rootPath, targetPath)

        await fs.rename(validatedSource, targetPath)
        console.log('[DEBUG] Moved successfully')
      }
      console.log('[DEBUG] All items moved')
    })

    // Open in system file explorer
    ipcMain.handle('fileManager:openInExplorer', async (event, targetPath: string) => {
      const windowId = BrowserWindow.fromWebContents(event.sender)?.id
      const rootPath = windowId ? rootPaths.get(windowId) : null

      if (!rootPath) {
        throw new Error('No root folder selected')
      }

      const validatedPath = validatePath(rootPath, targetPath)
      await shell.showItemInFolder(validatedPath)
    })

    // Open file with default application
    ipcMain.handle('fileManager:openFile', async (event, targetPath: string) => {
      const windowId = BrowserWindow.fromWebContents(event.sender)?.id
      const rootPath = windowId ? rootPaths.get(windowId) : null

      if (!rootPath) {
        throw new Error('No root folder selected')
      }

      const validatedPath = validatePath(rootPath, targetPath)
      const result = await shell.openPath(validatedPath)

      if (result) {
        throw new Error(`Failed to open file: ${result}`)
      }
    })

    // Path utilities
    ipcMain.handle('fileManager:joinPath', async (_event, ...paths: string[]) => {
      return path.join(...paths)
    })

    ipcMain.handle('fileManager:getParentPath', async (_event, targetPath: string) => {
      return path.dirname(targetPath)
    })

    console.log('[FileManager] All IPC handlers registered successfully')
  } catch (error) {
    console.error('[FileManager] Error setting up handlers:', error)
    throw error
  }
}

/**
 * Recursively copy directory
 */
async function copyRecursive(src: string, dest: string): Promise<void> {
  const stats = await fs.stat(src)

  if (stats.isDirectory()) {
    await fs.mkdir(dest, { recursive: true })
    const entries = await fs.readdir(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)
      await copyRecursive(srcPath, destPath)
    }
  } else {
    await fs.copyFile(src, dest)
  }
}
