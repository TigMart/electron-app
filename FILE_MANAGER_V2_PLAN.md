# File Manager V2 - Implementation Plan

## 🎯 Overview
This document outlines the complete refactoring and enhancement of the File Manager with rename functionality, drag-and-drop uploads, and modular component architecture.

## 📋 Architecture

### Component Structure
```
src/renderer/src/
├── pages/
│   └── FileManagerPage.tsx          # Orchestrator (state + routing)
├── components/
│   └── file-manager/
│       ├── Toolbar.tsx               # Action buttons, search, paste indicator
│       ├── Breadcrumbs.tsx           # Navigation breadcrumbs
│       ├── FileList.tsx              # Virtualized file table
│       ├── FileRow.tsx               # Individual row with inline rename
│       ├── DropZone.tsx              # Drag-drop upload surface
│       ├── ConfirmDialog.tsx         # Reusable confirmation dialog
│       ├── Toast.tsx                 # Non-blocking notifications
│       └── ProgressBar.tsx           # Upload/copy progress
├── hooks/
│   └── file-manager/
│       ├── useFileOps.ts             # File operations (copy/move/delete/rename)
│       ├── useDirectory.ts           # Directory listing + filters
│       ├── useDnD.ts                 # Drag-and-drop logic
│       └── useToast.ts               # Toast notifications
└── types/
    └── fileManager.ts                # ✅ Already updated
```

### IPC Contract Extensions

#### New Handlers (main/fileManager.ts)

1. **validateFileName** - Validates filename before rename
   ```typescript
   ipcMain.handle('fileManager:validateFileName', async (event, name: string, oldName?: string) => {
     // Returns ValidationError[]
     // Checks: empty, path separators, special chars, length
   })
   ```

2. **rename** - Enhanced with conflict detection
   ```typescript
   ipcMain.handle('fileManager:rename', async (event, oldPath: string, newName: string, options?: RenameOptions) => {
     // Returns RenameResult with conflict info
     // Preserves extension by default
     // Detects if target already exists
   })
   ```

3. **resolveConflict** - Handles rename/upload conflicts
   ```typescript
   ipcMain.handle('fileManager:resolveConflict', async (event, path: string, name: string, resolution: ConflictResolution) => {
     // Returns final filename
     // 'overwrite': replaces existing
     // 'keep-both': adds suffix (1), (2), etc.
     // 'cancel': throws error
   })
   ```

4. **upload** - Copy files from OS to current folder
   ```typescript
   ipcMain.handle('fileManager:upload', async (event, files: UploadFile[], destPath: string, options?: UploadOptions) => {
     // Returns UploadResult with per-file status
     // Validates MIME types against allowlist
     // Emits progress events
     // Handles conflicts per-file
   })
   ```

5. **Progress Events**
   ```typescript
   event.sender.send('fileManager:uploadProgress', {
     fileIndex: number,
     fileName: string,
     bytesTransferred: number,
     totalBytes: number,
     percent: number,
     status: 'uploading' | 'complete' | 'error'
   })
   ```

### Security Model

1. **Path Validation** (existing + enhanced)
   - All paths validated against root folder
   - No traversal outside selected root
   - Normalize all paths before use

2. **File Name Validation**
   ```typescript
   function validateFileName(name: string): ValidationError[] {
     const errors: ValidationError[] = []
     
     if (!name || name.trim().length === 0) {
       errors.push({ field: 'name', code: 'EMPTY_NAME', message: 'Name cannot be empty' })
     }
     if (name.includes('/') || name.includes('\\')) {
       errors.push({ field: 'name', code: 'PATH_SEPARATOR', message: 'Name cannot contain / or \\' })
     }
     if (name.length > 255) {
       errors.push({ field: 'name', code: 'TOO_LONG', message: 'Name too long (max 255 chars)' })
     }
     
     // Additional platform-specific checks for Windows: < > : " | ? *
     
     return errors
   }
   ```

3. **MIME Type Validation**
   ```typescript
   const ALLOWED_TYPES = [
     'application/pdf',
     'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'image/png',
     'image/jpeg',
     'image/gif',
     'image/webp'
   ]
   
   const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.webp']
   
   function isAllowedFile(filename: string, mimeType?: string): boolean {
     const ext = path.extname(filename).toLowerCase()
     return ALLOWED_EXTENSIONS.includes(ext)
   }
   ```

4. **Conflict Resolution**
   ```typescript
   async function generateUniqueFileName(dir: string, baseName: string, ext: string): Promise<string> {
     let counter = 1
     let newName = `${baseName}${ext}`
     
     while (await fs.access(path.join(dir, newName)).then(() => true).catch(() => false)) {
       newName = `${baseName} (${counter})${ext}`
       counter++
     }
     
     return newName
   }
   ```

## 🔧 Implementation Steps

### Phase 1: Main Process Handlers (You are here)

Create these functions in `src/main/fileManager.ts`:

1. **validateFileName**
   - Empty name check
   - Path separator check  
   - Special character validation
   - Length validation
   - Return array of ValidationError

2. **Enhanced rename**
   - Extract old extension
   - Validate new name
   - Preserve extension if not explicitly changed
   - Check if target exists (conflict)
   - Return RenameResult with conflict flag

3. **resolveConflict**
   - If 'cancel': throw error
   - If 'overwrite': return original name
   - If 'keep-both': generate unique name with suffix

4. **upload handler**
   - Loop through files
   - Validate each against allowlist
   - Copy to destination
   - Handle conflicts per options
   - Emit progress events
   - Return UploadResult with details

### Phase 2: Custom Hooks

1. **useToast** (`src/renderer/src/hooks/file-manager/useToast.ts`)
   ```typescript
   export function useToast() {
     const [toasts, setToasts] = useState<Toast[]>([])
     
     const showToast = (message: string, type: 'success' | 'error' | 'info') => {
       const id = Date.now()
       setToasts(prev => [...prev, { id, message, type }])
       setTimeout(() => removeToast(id), 3000)
     }
     
     const removeToast = (id: number) => {
       setToasts(prev => prev.filter(t => t.id !== id))
     }
     
     return { toasts, showToast, removeToast }
   }
   ```

2. **useDirectory** (`src/renderer/src/hooks/file-manager/useDirectory.ts`)
   ```typescript
   export function useDirectory(currentPath: string, options: ListOptions) {
     const [files, setFiles] = useState<FileItem[]>([])
     const [loading, setLoading] = useState(false)
     const [error, setError] = useState<string | null>(null)
     
     const loadFiles = useCallback(async () => {
       if (!currentPath) return
       
       setLoading(true)
       try {
         const items = await window.fileManager.listFiles(currentPath, options)
         setFiles(items)
         setError(null)
       } catch (err) {
         setError(err.message)
       } finally {
         setLoading(false)
       }
     }, [currentPath, options])
     
     useEffect(() => { loadFiles() }, [loadFiles])
     
     return { files, loading, error, refresh: loadFiles }
   }
   ```

3. **useFileOps** (`src/renderer/src/hooks/file-manager/useFileOps.ts`)
   ```typescript
   export function useFileOps(currentPath: string, onRefresh: () => void) {
     const { showToast } = useToast()
     
     const rename = async (oldPath: string, newName: string) => {
       try {
         // Validate first
         const errors = await window.fileManager.validateFileName(newName, oldPath)
         if (errors.length > 0) {
           showToast(errors[0].message, 'error')
           return null
         }
         
         // Attempt rename
         const result = await window.fileManager.rename(oldPath, newName, { preserveExtension: true })
         
         // Handle conflicts
         if (result.conflict) {
           // Show conflict dialog, get resolution
           const resolution = await showConflictDialog(result.conflict)
           const finalName = await window.fileManager.resolveConflict(oldPath, newName, resolution)
           await window.fileManager.rename(oldPath, finalName)
         }
         
         showToast('Renamed successfully', 'success')
         onRefresh()
         return result.finalName
       } catch (err) {
         showToast(`Rename failed: ${err.message}`, 'error')
         return null
       }
     }
     
     const remove = async (paths: string[], toTrash: boolean) => { /* ... */ }
     const copy = async (paths: string[], dest: string) => { /* ... */ }
     const move = async (paths: string[], dest: string) => { /* ... */ }
     
     return { rename, remove, copy, move }
   }
   ```

4. **useDnD** (`src/renderer/src/hooks/file-manager/useDnD.ts`)
   ```typescript
   export function useDnD(currentPath: string, onUploadComplete: () => void) {
     const [isDragging, setIsDragging] = useState(false)
     const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
     
     useEffect(() => {
       const unsubscribe = window.fileManager.onUploadProgress((progress) => {
         setUploadProgress(prev => {
           const updated = [...prev]
           updated[progress.fileIndex] = progress
           return updated
         })
       })
       
       return unsubscribe
     }, [])
     
     const handleDrop = async (e: React.DragEvent) => {
       e.preventDefault()
       setIsDragging(false)
       
       const files: UploadFile[] = Array.from(e.dataTransfer.files).map(f => ({
         name: f.name,
         path: f.path,
         size: f.size,
         type: f.type
       }))
       
       try {
         const result = await window.fileManager.upload(files, currentPath, {
           allowedTypes: ALLOWED_UPLOAD_TYPES,
           onConflict: 'keep-both'
         })
         
         // Show results
         onUploadComplete()
       } catch (err) {
         // Handle error
       }
     }
     
     return { isDragging, uploadProgress, handleDrop, setIsDragging }
   }
   ```

### Phase 3: UI Components

1. **FileRow** with inline rename
   - Double-click or F2 to edit
   - Input field replaces name
   - Auto-select name without extension
   - ESC cancels, Enter confirms
   - Call useFileOps.rename on confirm

2. **DropZone**
   - Overlay on drag enter
   - "Drop N files to upload" message
   - Accept only allowed types
   - Show per-file progress
   - Display final results

3. **Toolbar, Breadcrumbs, FileList, etc.**
   - Extract from monolithic FilesPage
   - Pass props, minimize state
   - Use hooks for side effects

### Phase 4: Integration

1. Refactor FilesPage.tsx to orchestrator
2. Wire up components
3. Test rename flow end-to-end
4. Test upload flow end-to-end
5. Test on macOS and Windows

## 📝 Rename Rules

1. **Extension Preservation**
   - By default, preserve the original extension
   - If user explicitly changes extension, warn but allow
   - Extract extension: `path.extname(oldName)`
   - If newName has no extension, append old extension

2. **Validation**
   - No empty names
   - No path separators (/ \\)
   - No special chars (Windows: < > : " | ? *)
   - Max 255 characters
   - Trim whitespace

3. **Conflict Handling**
   - Detect if target name already exists
   - Prompt user: Overwrite / Keep both / Cancel
   - Keep both: add suffix `Filename (1).ext`
   - Auto-increment if (1) also exists

## 📤 Upload Specifications

1. **Allowed Types**
   - PDF: `application/pdf`, `.pdf`
   - Word: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `.doc`, `.docx`
   - Images: `image/png`, `image/jpeg`, `image/gif`, `image/webp`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`

2. **Upload Flow**
   ```
   User drops files
   → Validate each file type
   → For each valid file:
       → Check if exists in destination
       → Handle conflict (skip/overwrite/keep-both)
       → Copy file
       → Emit progress
   → Show results (uploaded/skipped/failed)
   ```

3. **Progress Events**
   - Per-file progress (bytes transferred)
   - Overall progress (N of M files)
   - Status: pending → uploading → complete/error/skipped

4. **Conflict Resolution**
   - Per-file basis
   - User can set default (apply to all)
   - Options: Overwrite, Keep both (suffix), Skip

## 🔒 Security Model

1. **No Direct fs Access in Renderer**
   - All operations via IPC
   - contextIsolation: true
   - No Node integration

2. **Path Scoping**
   - All paths validated against root
   - Use path.normalize() + path.resolve()
   - Check: resolved.startsWith(root)

3. **Input Validation**
   - Validate all filenames
   - Validate MIME types
   - Sanitize user input

4. **Safe Operations**
   - Use fs/promises
   - Use shell.trashItem for delete
   - Handle errors gracefully

## 📊 State Flow

```
FileManagerPage (root state)
  ├─ rootPath, currentPath
  ├─ selectedFiles
  └─ clipboard

useDirectory(currentPath)
  ├─ files
  ├─ loading
  └─ refresh()

useFileOps(currentPath, refresh)
  ├─ rename()
  ├─ remove()
  ├─ copy()
  └─ move()

useDnD(currentPath, refresh)
  ├─ isDragging
  ├─ uploadProgress
  └─ handleDrop()

useToast()
  ├─ toasts
  └─ showToast()
```

## ✅ Acceptance Criteria

- [ ] Rename works with extension preservation
- [ ] Rename validates name (no empty, no separators)
- [ ] Rename detects conflicts and prompts user
- [ ] Rename shows error messages in UI
- [ ] Upload accepts drag-and-drop from OS
- [ ] Upload validates file types (allowlist only)
- [ ] Upload shows per-file progress
- [ ] Upload handles conflicts (per-file resolution)
- [ ] Upload ignores folders
- [ ] Components are modular and testable
- [ ] All operations via IPC (no direct fs access)
- [ ] Works on macOS 12+ and Windows 10/11
- [ ] F2 activates inline rename
- [ ] ESC cancels rename, Enter confirms

## 📚 File Changes Summary

### New Files
- `src/main/fileManager.ts` - Enhanced handlers
- `src/renderer/src/hooks/file-manager/useFileOps.ts`
- `src/renderer/src/hooks/file-manager/useDirectory.ts`
- `src/renderer/src/hooks/file-manager/useDnD.ts`
- `src/renderer/src/hooks/file-manager/useToast.ts`
- `src/renderer/src/components/file-manager/Toolbar.tsx`
- `src/renderer/src/components/file-manager/Breadcrumbs.tsx`
- `src/renderer/src/components/file-manager/FileList.tsx`
- `src/renderer/src/components/file-manager/FileRow.tsx`
- `src/renderer/src/components/file-manager/DropZone.tsx`
- `src/renderer/src/components/file-manager/ConfirmDialog.tsx`
- `src/renderer/src/components/file-manager/Toast.tsx`
- `src/renderer/src/components/file-manager/ProgressBar.tsx`

### Modified Files
- `src/renderer/src/types/fileManager.ts` - ✅ Updated
- `src/preload/index.ts` - ✅ Updated
- `src/preload/index.d.ts` - ✅ Updated
- `src/main/fileManager.ts` - Need to enhance handlers
- `src/renderer/src/pages/FilesPage.tsx` - Will refactor to FileManagerPage.tsx

## 🚀 Next Steps

1. Implement main process handlers (validateFileName, enhanced rename, resolveConflict, upload)
2. Create custom hooks (useFileOps, useDirectory, useDnD, useToast)
3. Build UI components (FileRow with inline rename, DropZone, etc.)
4. Refactor FilesPage into modular FileManagerPage
5. Test end-to-end on both platforms
6. Write integration tests

---

**Current Status**: Ready to implement main process handlers
**Estimated Time**: 4-6 hours for full implementation
**Priority**: High - Core functionality enhancement
