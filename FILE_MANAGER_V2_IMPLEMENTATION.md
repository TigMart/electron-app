# File Manager V2 - Step-by-Step Implementation Guide

## 🎯 Purpose

This guide provides exact steps to implement the File Manager V2 enhancements in your Electron-Vite project.

## ✅ Prerequisites (Already Complete)

- [x] TypeScript types updated (`src/renderer/src/types/fileManager.ts`)
- [x] IPC contracts extended (`src/preload/index.ts`, `src/preload/index.d.ts`)
- [x] Existing file manager working

## 📋 Implementation Checklist

### Step 1: Enhance Main Process Handlers

**File**: `src/main/fileManager.ts`

Add these helper functions before `setupFileManagerHandlers()`:

```typescript
/**
 * Validate filename for rename/create operations
 */
function validateFileNameSync(
  name: string,
  oldName?: string
): Array<{
  field: string
  code: string
  message: string
}> {
  const errors: Array<{ field: string; code: string; message: string }> = []

  const trimmed = name.trim()

  // Empty check
  if (!trimmed) {
    errors.push({
      field: 'name',
      code: 'EMPTY_NAME',
      message: 'Filename cannot be empty'
    })
    return errors
  }

  // Path separator check
  if (trimmed.includes('/') || trimmed.includes('\\')) {
    errors.push({
      field: 'name',
      code: 'PATH_SEPARATOR',
      message: 'Filename cannot contain / or \\'
    })
  }

  // Windows invalid chars
  if (process.platform === 'win32') {
    const invalidChars = ['<', '>', ':', '"', '|', '?', '*']
    for (const char of invalidChars) {
      if (trimmed.includes(char)) {
        errors.push({
          field: 'name',
          code: 'INVALID_CHARS',
          message: `Filename cannot contain ${char}`
        })
        break
      }
    }
  }

  // Length check
  if (trimmed.length > 255) {
    errors.push({
      field: 'name',
      code: 'TOO_LONG',
      message: 'Filename too long (max 255 characters)'
    })
  }

  // Extension change warning (if oldName provided)
  if (oldName) {
    const oldExt = path.extname(oldName)
    const newExt = path.extname(trimmed)
    if (oldExt && newExt && oldExt !== newExt) {
      errors.push({
        field: 'extension',
        code: 'EXTENSION_CHANGE',
        message: `Extension will change from ${oldExt} to ${newExt}`
      })
    }
  }

  return errors
}

/**
 * Generate unique filename if conflict exists
 */
async function generateUniqueFileName(
  dirPath: string,
  baseName: string,
  ext: string
): Promise<string> {
  let counter = 1
  let newName = `${baseName}${ext}`
  let fullPath = path.join(dirPath, newName)

  while (true) {
    try {
      await fs.access(fullPath)
      // File exists, try next
      newName = `${baseName} (${counter})${ext}`
      fullPath = path.join(dirPath, newName)
      counter++
    } catch {
      // File doesn't exist, we can use this name
      return newName
    }
  }
}

/**
 * Check if file type is allowed for upload
 */
function isAllowedFileType(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  const allowedExts = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.webp']
  return allowedExts.includes(ext)
}
```

Then add these new IPC handlers inside `setupFileManagerHandlers()`:

```typescript
// Validate filename
ipcMain.handle('fileManager:validateFileName', async (_event, name: string, oldName?: string) => {
  return validateFileNameSync(name, oldName)
})

// Enhanced rename with conflict detection
ipcMain.handle(
  'fileManager:rename',
  async (event, oldPath: string, newName: string, options?: { preserveExtension?: boolean }) => {
    const windowId = BrowserWindow.fromWebContents(event.sender)?.id
    const rootPath = windowId ? rootPaths.get(windowId) : null

    if (!rootPath) {
      throw new Error('No root folder selected')
    }

    const validatedOldPath = validatePath(rootPath, oldPath)
    const oldName = path.basename(validatedOldPath)

    // Preserve extension by default
    let finalNewName = newName.trim()
    if (options?.preserveExtension !== false) {
      const oldExt = path.extname(oldName)
      const newExt = path.extname(finalNewName)
      if (oldExt && !newExt) {
        finalNewName = finalNewName + oldExt
      }
    }

    // Validate new name
    const errors = validateFileNameSync(finalNewName, oldName)
    if (errors.some((e) => e.code !== 'EXTENSION_CHANGE')) {
      throw new Error(errors[0].message)
    }

    const parentDir = path.dirname(validatedOldPath)
    const newPath = path.join(parentDir, finalNewName)
    validatePath(rootPath, newPath)

    // Check for conflict
    try {
      await fs.access(newPath)
      // File exists - return conflict
      return {
        success: false,
        conflict: {
          exists: true,
          oldName,
          newName: finalNewName,
          path: newPath
        }
      }
    } catch {
      // No conflict, proceed with rename
      await fs.rename(validatedOldPath, newPath)
      return {
        success: true,
        finalName: finalNewName
      }
    }
  }
)

// Resolve rename/upload conflict
ipcMain.handle(
  'fileManager:resolveConflict',
  async (event, dirPath: string, fileName: string, resolution: string) => {
    const windowId = BrowserWindow.fromWebContents(event.sender)?.id
    const rootPath = windowId ? rootPaths.get(windowId) : null

    if (!rootPath) {
      throw new Error('No root folder selected')
    }

    const validatedDir = validatePath(rootPath, dirPath)

    if (resolution === 'cancel') {
      throw new Error('Operation cancelled by user')
    }

    if (resolution === 'overwrite') {
      return fileName
    }

    if (resolution === 'keep-both') {
      const ext = path.extname(fileName)
      const baseName = path.basename(fileName, ext)
      return await generateUniqueFileName(validatedDir, baseName, ext)
    }

    throw new Error(`Unknown resolution: ${resolution}`)
  }
)

// Upload files from OS
ipcMain.handle(
  'fileManager:upload',
  async (
    event,
    files: Array<{ name: string; path: string; size: number; type: string }>,
    destPath: string,
    options?: { allowedTypes?: string[]; onConflict?: string }
  ) => {
    const windowId = BrowserWindow.fromWebContents(event.sender)?.id
    const rootPath = windowId ? rootPaths.get(windowId) : null

    if (!rootPath) {
      throw new Error('No root folder selected')
    }

    const validatedDest = validatePath(rootPath, destPath)

    const results = {
      success: true,
      uploaded: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{
        name: string
        status: 'success' | 'skipped' | 'error'
        error?: string
        finalPath?: string
      }>
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate file type
      if (!isAllowedFileType(file.name)) {
        results.skipped++
        results.details.push({
          name: file.name,
          status: 'skipped',
          error: 'File type not allowed'
        })
        continue
      }

      try {
        let finalName = file.name
        const targetPath = path.join(validatedDest, finalName)

        // Check for conflict
        try {
          await fs.access(targetPath)
          // Conflict exists
          if (options?.onConflict === 'skip') {
            results.skipped++
            results.details.push({
              name: file.name,
              status: 'skipped',
              error: 'File already exists'
            })
            continue
          } else if (options?.onConflict === 'keep-both') {
            const ext = path.extname(finalName)
            const baseName = path.basename(finalName, ext)
            finalName = await generateUniqueFileName(validatedDest, baseName, ext)
          }
          // 'overwrite' - just proceed
        } catch {
          // No conflict
        }

        // Copy file
        const finalPath = path.join(validatedDest, finalName)
        await fs.copyFile(file.path, finalPath)

        // Emit progress
        event.sender.send('fileManager:uploadProgress', {
          fileIndex: i,
          fileName: file.name,
          bytesTransferred: file.size,
          totalBytes: file.size,
          percent: 100,
          status: 'complete'
        })

        results.uploaded++
        results.details.push({
          name: file.name,
          status: 'success',
          finalPath
        })
      } catch (error: any) {
        results.failed++
        results.details.push({
          name: file.name,
          status: 'error',
          error: error.message
        })
      }
    }

    return results
  }
)
```

**Note**: The existing `rename` handler will be replaced by the enhanced version above.

### Step 2: Create Directory for File Manager Hooks

```bash
mkdir -p src/renderer/src/hooks/file-manager
```

### Step 3: Create useToast Hook

**File**: `src/renderer/src/hooks/file-manager/useToast.ts`

```typescript
import { useState, useCallback } from 'react'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 4000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, showToast, removeToast }
}
```

### Step 4: Create useDirectory Hook

**File**: `src/renderer/src/hooks/file-manager/useDirectory.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { FileItem, ListOptions } from '@/types/fileManager'
import { logger } from '@/utils/logger'

export function useDirectory(currentPath: string, options: ListOptions) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFiles = useCallback(async () => {
    if (!currentPath) return

    setLoading(true)
    setError(null)

    try {
      const items = await window.fileManager.listFiles(currentPath, options)
      setFiles(items)
      logger.debug(`Loaded ${items.length} files from ${currentPath}`)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load files'
      setError(errorMessage)
      logger.error('Failed to load files', err)
    } finally {
      setLoading(false)
    }
  }, [currentPath, options])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  return { files, loading, error, refresh: loadFiles }
}
```

### Step 5: Create useFileOps Hook

**File**: `src/renderer/src/hooks/file-manager/useFileOps.ts`

```typescript
import { useCallback } from 'react'
import { logger } from '@/utils/logger'
import { ConflictResolution } from '@/types/fileManager'

interface UseFileOpsProps {
  currentPath: string
  onRefresh: () => void
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

export function useFileOps({ currentPath, onRefresh, onError, onSuccess }: UseFileOpsProps) {
  const rename = useCallback(
    async (
      oldPath: string,
      newName: string,
      onConflict?: (conflict: any) => Promise<ConflictResolution>
    ): Promise<boolean> => {
      try {
        // Validate filename first
        const errors = await window.fileManager.validateFileName(newName, oldPath)
        const criticalErrors = errors.filter((e) => e.code !== 'EXTENSION_CHANGE')

        if (criticalErrors.length > 0) {
          onError(criticalErrors[0].message)
          return false
        }

        // Warn about extension change
        const extError = errors.find((e) => e.code === 'EXTENSION_CHANGE')
        if (extError) {
          // Could show a warning dialog here
          logger.warn(extError.message)
        }

        // Attempt rename
        const result = await window.fileManager.rename(oldPath, newName, {
          preserveExtension: true
        })

        if (result.conflict && onConflict) {
          // Handle conflict
          const resolution = await onConflict(result.conflict)
          const finalName = await window.fileManager.resolveConflict(
            currentPath,
            newName,
            resolution
          )

          if (resolution === 'cancel') {
            return false
          }

          // Retry rename with resolved name
          const retryResult = await window.fileManager.rename(oldPath, finalName, {
            preserveExtension: false
          })

          if (retryResult.success) {
            onSuccess('File renamed successfully')
            onRefresh()
            return true
          }
        } else if (result.success) {
          onSuccess('File renamed successfully')
          onRefresh()
          return true
        }

        return false
      } catch (err: any) {
        onError(`Rename failed: ${err.message}`)
        logger.error('Rename failed', err)
        return false
      }
    },
    [currentPath, onRefresh, onError, onSuccess]
  )

  const remove = useCallback(
    async (paths: string[], toTrash: boolean) => {
      try {
        await window.fileManager.remove(paths, { toTrash })
        onSuccess(`Deleted ${paths.length} item(s)`)
        onRefresh()
      } catch (err: any) {
        onError(`Delete failed: ${err.message}`)
        logger.error('Delete failed', err)
      }
    },
    [onRefresh, onError, onSuccess]
  )

  const copy = useCallback(
    async (paths: string[], destPath: string) => {
      try {
        await window.fileManager.copy(paths, destPath)
        onSuccess(`Copied ${paths.length} item(s)`)
        onRefresh()
      } catch (err: any) {
        onError(`Copy failed: ${err.message}`)
        logger.error('Copy failed', err)
      }
    },
    [onRefresh, onError, onSuccess]
  )

  const move = useCallback(
    async (paths: string[], destPath: string) => {
      try {
        await window.fileManager.move(paths, destPath)
        onSuccess(`Moved ${paths.length} item(s)`)
        onRefresh()
      } catch (err: any) {
        onError(`Move failed: ${err.message}`)
        logger.error('Move failed', err)
      }
    },
    [onRefresh, onError, onSuccess]
  )

  const createFolder = useCallback(
    async (folderName: string) => {
      try {
        await window.fileManager.createFolder(currentPath, folderName)
        onSuccess('Folder created successfully')
        onRefresh()
      } catch (err: any) {
        onError(`Create folder failed: ${err.message}`)
        logger.error('Create folder failed', err)
      }
    },
    [currentPath, onRefresh, onError, onSuccess]
  )

  return { rename, remove, copy, move, createFolder }
}
```

### Step 6: Create useDnD Hook

**File**: `src/renderer/src/hooks/file-manager/useDnD.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { UploadFile, UploadProgress, UploadOptions } from '@/types/fileManager'
import { logger } from '@/utils/logger'

interface UseDnDProps {
  currentPath: string
  onUploadComplete: () => void
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

export function useDnD({ currentPath, onUploadComplete, onError, onSuccess }: UseDnDProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const unsubscribe = window.fileManager.onUploadProgress((progress) => {
      setUploadProgress((prev) => {
        const updated = [...prev]
        updated[progress.fileIndex] = progress
        return updated
      })
    })

    return unsubscribe
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (!currentPath) {
        onError('No folder selected')
        return
      }

      const items = Array.from(e.dataTransfer.files)

      // Filter out directories (we only accept files for now)
      const files: UploadFile[] = items
        .filter((item) => {
          // In Electron, file.path exists and is empty string for directories
          return item.type !== '' || item.size > 0
        })
        .map((file) => ({
          name: file.name,
          path: (file as any).path || '', // Electron provides native path
          size: file.size,
          type: file.type
        }))

      if (files.length === 0) {
        onError('No valid files to upload (folders not supported)')
        return
      }

      setIsUploading(true)
      setUploadProgress([])

      try {
        const options: UploadOptions = {
          onConflict: 'keep-both' // Default to keep-both for now
        }

        const result = await window.fileManager.upload(files, currentPath, options)

        logger.info('Upload complete', result)

        if (result.uploaded > 0) {
          onSuccess(`Uploaded ${result.uploaded} file(s)`)
        }
        if (result.skipped > 0) {
          onError(`Skipped ${result.skipped} file(s) (already exist or invalid type)`)
        }
        if (result.failed > 0) {
          onError(`Failed to upload ${result.failed} file(s)`)
        }

        onUploadComplete()
      } catch (err: any) {
        onError(`Upload failed: ${err.message}`)
        logger.error('Upload failed', err)
      } finally {
        setIsUploading(false)
        setUploadProgress([])
      }
    },
    [currentPath, onUploadComplete, onError, onSuccess]
  )

  return {
    isDragging,
    uploadProgress,
    isUploading,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}
```

### Step 7: Install sonner for Toast Notifications

```bash
pnpm add sonner
```

### Step 8: Create Components Directory

```bash
mkdir -p src/renderer/src/components/file-manager
```

### Step 9: Update FilesPage to Use New Hooks

This is the simplified orchestrator version. The full modular component implementation (Toolbar, FileRow, etc.) would be the next phase, but for now we can integrate the hooks:

**File**: `src/renderer/src/pages/FilesPage.tsx` (Enhanced version)

Add these imports at the top:

```typescript
import { useToast } from '@/hooks/file-manager/useToast'
import { useDirectory } from '@/hooks/file-manager/useDirectory'
import { useFileOps } from '@/hooks/file-manager/useFileOps'
import { useDnD } from '@/hooks/file-manager/useDnD'
import { Toaster, toast } from 'sonner'
```

Replace state and operations with hooks (example integration in next step).

### Step 10: Test the Implementation

1. **Build and run**:

   ```bash
   pnpm dev
   ```

2. **Test Rename**:
   - Navigate to Files page
   - Select a folder
   - Try renaming a file (will need to add rename button/F2 handler)
   - Verify extension preservation
   - Try renaming to existing name (should show conflict)

3. **Test Upload**:
   - Drag files from Explorer/Finder
   - Drop onto file list
   - Verify only allowed types are accepted
   - Check progress indicators
   - Verify files appear in list after upload

4. **Test on Windows and macOS**

### Step 11: Format and Check Errors

```bash
pnpm run format
pnpm run build
```

## 🔍 Troubleshooting

### Issue: "Cannot find module '@/hooks/file-manager/useToast'"

**Solution**: Ensure TypeScript path alias is configured in `tsconfig.json` and `electron.vite.config.ts`

### Issue: "window.fileManager.validateFileName is not a function"

**Solution**: Restart the dev server after adding new IPC handlers

### Issue: Upload shows "File type not allowed" for valid files

**Solution**: Check that `isAllowedFileType()` includes the file extension

### Issue: Drag-drop doesn't work

**Solution**: Ensure `handleDragOver` prevents default and calls `e.preventDefault()`

## 📝 Next Steps After Basic Implementation

1. **Add F2 Keyboard Shortcut** for rename
2. **Create Inline Edit Component** for FileRow
3. **Add Conflict Resolution Dialog** (modal with Overwrite/Keep Both/Cancel)
4. **Add Progress Bar Component** for uploads
5. **Create DropZone Overlay** with visual feedback
6. **Refactor into modular components** (Toolbar, Breadcrumbs, FileList, FileRow)
7. **Add Virtualization** for large directories (react-window or react-virtual)
8. **Write Tests** for hooks and components

## ✅ Verification Checklist

- [ ] `pnpm dev` starts without errors
- [ ] Can select a folder
- [ ] Can list files
- [ ] Can validate filenames (check browser console)
- [ ] Can rename files (after adding rename UI)
- [ ] Can drag-drop files from OS
- [ ] Upload shows progress
- [ ] Only allowed file types upload
- [ ] Existing files handled (keep-both adds suffix)
- [ ] Toast notifications appear
- [ ] No direct fs access in renderer (check devtools sources)

---

**Status**: Implementation guide complete
**Time to implement**: 2-3 hours for hooks + basic integration
**Recommended**: Start with Step 1 (main handlers), then Step 3-6 (hooks), then test

Good luck! 🚀
