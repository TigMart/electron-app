# File Manager V2 - Component Examples

This document provides complete, copy-paste ready component implementations for the modular File Manager.

## 📁 File Structure

```
src/renderer/src/
├── components/
│   └── file-manager/
│       ├── Toolbar.tsx
│       ├── Breadcrumbs.tsx
│       ├── FileList.tsx
│       ├── FileRow.tsx
│       ├── DropZone.tsx
│       └── ConflictDialog.tsx
├── hooks/
│   └── file-manager/
│       ├── useToast.ts         ✅ Created
│       ├── useDirectory.ts      ✅ Created
│       ├── useFileOps.ts        ✅ Created
│       └── useDnD.ts            ✅ Created
└── pages/
    └── FileManagerPage.tsx (refactored FilesPage)
```

## 🔧 Component: Toolbar

**File**: `src/renderer/src/components/file-manager/Toolbar.tsx`

```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Folder,
  FolderPlus,
  Copy,
  Move,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Search
} from 'lucide-react'

interface ToolbarProps {
  onSelectFolder: () => void
  onNewFolder: () => void
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
  onDelete: () => void
  onRefresh: () => void
  onToggleHidden: () => void
  showHidden: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCount: number
  hasClipboard: boolean
  clipboardOperation?: 'copy' | 'move'
}

export function Toolbar({
  onSelectFolder,
  onNewFolder,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onRefresh,
  onToggleHidden,
  showHidden,
  searchQuery,
  onSearchChange,
  selectedCount,
  hasClipboard,
  clipboardOperation
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2">
      <Button onClick={onSelectFolder} variant="outline" size="sm">
        <Folder className="mr-2 h-4 w-4" />
        Choose Folder
      </Button>

      <div className="h-6 w-px bg-border" />

      <Button onClick={onNewFolder} variant="outline" size="sm">
        <FolderPlus className="mr-2 h-4 w-4" />
        New Folder
      </Button>

      <Button onClick={onCopy} variant="outline" size="sm" disabled={selectedCount === 0}>
        <Copy className="mr-2 h-4 w-4" />
        Copy
      </Button>

      <Button onClick={onCut} variant="outline" size="sm" disabled={selectedCount === 0}>
        <Move className="mr-2 h-4 w-4" />
        Cut
      </Button>

      <Button onClick={onPaste} variant="outline" size="sm" disabled={!hasClipboard}>
        Paste
        {hasClipboard && clipboardOperation && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({clipboardOperation})
          </span>
        )}
      </Button>

      <Button onClick={onDelete} variant="outline" size="sm" disabled={selectedCount === 0}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>

      <div className="h-6 w-px bg-border" />

      <Button onClick={onRefresh} variant="outline" size="sm">
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>

      <Button
        onClick={onToggleHidden}
        variant="outline"
        size="sm"
        title={showHidden ? 'Hide hidden files' : 'Show hidden files'}
      >
        {showHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-64"
        />
      </div>
    </div>
  )
}
```

## 🍞 Component: Breadcrumbs

**File**: `src/renderer/src/components/file-manager/Breadcrumbs.tsx`

```typescript
import { Button } from '@/components/ui/button'
import { Home, ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  name: string
  path: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  onNavigate: (path: string) => void
}

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <div className="flex items-center gap-2 text-sm">
      <Button onClick={() => onNavigate(items[0].path)} variant="ghost" size="sm">
        <Home className="h-4 w-4" />
      </Button>

      {items.slice(1).map((item) => (
        <div key={item.path} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            onClick={() => onNavigate(item.path)}
            variant="ghost"
            size="sm"
            className="font-normal"
          >
            {item.name}
          </Button>
        </div>
      ))}
    </div>
  )
}
```

## 📋 Component: FileList

**File**: `src/renderer/src/components/file-manager/FileList.tsx`

```typescript
import { FileItem } from '@/types/fileManager'
import { FileRow } from './FileRow'
import { Folder, RefreshCw } from 'lucide-react'

interface FileListProps {
  files: FileItem[]
  loading: boolean
  selectedFiles: Set<string>
  onToggleSelection: (path: string) => void
  onNavigate: (path: string) => void
  onRename: (path: string, newName: string) => void
  onOpenFile: (path: string) => void
  onRevealInExplorer: (path: string) => void
  canGoUp: boolean
  onGoUp: () => void
}

export function FileList({
  files,
  loading,
  selectedFiles,
  onToggleSelection,
  onNavigate,
  onRename,
  onOpenFile,
  onRevealInExplorer,
  canGoUp,
  onGoUp
}: FileListProps) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <Folder className="h-12 w-12" />
        <p>No files found</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead className="sticky top-0 bg-muted">
        <tr className="border-b text-left text-sm">
          <th className="w-12 p-2"></th>
          <th className="p-2">Name</th>
          <th className="w-32 p-2">Type</th>
          <th className="w-32 p-2">Size</th>
          <th className="w-48 p-2">Modified</th>
          <th className="w-24 p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {canGoUp && (
          <tr className="cursor-pointer border-b hover:bg-muted/50" onClick={onGoUp}>
            <td className="p-2"></td>
            <td className="flex items-center gap-2 p-2">
              <Folder className="h-4 w-4" />
              <span>..</span>
            </td>
            <td className="p-2"></td>
            <td className="p-2"></td>
            <td className="p-2"></td>
            <td className="p-2"></td>
          </tr>
        )}

        {files.map((file) => (
          <FileRow
            key={file.path}
            file={file}
            selected={selectedFiles.has(file.path)}
            onToggleSelection={() => onToggleSelection(file.path)}
            onNavigate={() => file.type === 'directory' && onNavigate(file.path)}
            onRename={(newName) => onRename(file.path, newName)}
            onOpenFile={() => onOpenFile(file.path)}
            onRevealInExplorer={() => onRevealInExplorer(file.path)}
          />
        ))}
      </tbody>
    </table>
  )
}
```

## 📄 Component: FileRow (with Inline Rename)

**File**: `src/renderer/src/components/file-manager/FileRow.tsx`

```typescript
import { useState, useRef, useEffect } from 'react'
import { FileItem } from '@/types/fileManager'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Folder, File, ExternalLink } from 'lucide-react'

interface FileRowProps {
  file: FileItem
  selected: boolean
  onToggleSelection: () => void
  onNavigate: () => void
  onRename: (newName: string) => void
  onOpenFile: () => void
  onRevealInExplorer: () => void
}

export function FileRow({
  file,
  selected,
  onToggleSelection,
  onNavigate,
  onRename,
  onOpenFile,
  onRevealInExplorer
}: FileRowProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameName, setRenameName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Start rename mode
  const startRename = () => {
    setRenameName(file.name)
    setIsRenaming(true)
  }

  // Auto-focus and select name without extension
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()

      // Select filename without extension
      const ext = file.extension ? `.${file.extension}` : ''
      const nameWithoutExt = file.name.replace(ext, '')
      inputRef.current.setSelectionRange(0, nameWithoutExt.length)
    }
  }, [isRenaming, file.name, file.extension])

  // Confirm rename
  const confirmRename = () => {
    if (renameName.trim() && renameName !== file.name) {
      onRename(renameName.trim())
    }
    setIsRenaming(false)
  }

  // Cancel rename
  const cancelRename = () => {
    setIsRenaming(false)
    setRenameName('')
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelRename()
    }
  }

  // F2 shortcut on row (when not renaming)
  const handleRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'F2' && !isRenaming) {
      e.preventDefault()
      startRename()
    }
  }

  return (
    <tr
      className={`cursor-pointer border-b hover:bg-muted/50 ${selected ? 'bg-accent' : ''}`}
      onClick={onNavigate}
      onKeyDown={handleRowKeyDown}
      tabIndex={0}
    >
      <td className="p-2">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelection}
          onClick={(e) => e.stopPropagation()}
        />
      </td>

      <td className="p-2">
        <div className="flex items-center gap-2">
          {file.type === 'directory' ? (
            <Folder className="h-4 w-4 shrink-0 text-blue-500" />
          ) : (
            <File className="h-4 w-4 shrink-0" />
          )}

          {isRenaming ? (
            <Input
              ref={inputRef}
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={confirmRename}
              onClick={(e) => e.stopPropagation()}
              className="h-6 py-0 px-1"
            />
          ) : (
            <span
              className={file.isHidden ? 'text-muted-foreground' : ''}
              onDoubleClick={(e) => {
                e.stopPropagation()
                startRename()
              }}
            >
              {file.name}
            </span>
          )}
        </div>
      </td>

      <td className="p-2 text-sm text-muted-foreground">
        {file.type === 'directory' ? 'Folder' : file.extension?.toUpperCase() || 'File'}
      </td>

      <td className="p-2 text-sm text-muted-foreground">
        {file.type === 'file' ? formatBytes(file.size) : '-'}
      </td>

      <td className="p-2 text-sm text-muted-foreground">
        {new Date(file.modified).toLocaleString()}
      </td>

      <td className="p-2">
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {file.type === 'file' && (
            <Button onClick={onOpenFile} variant="ghost" size="sm" title="Open">
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}

          <Button onClick={onRevealInExplorer} variant="ghost" size="sm" title="Show in Explorer">
            <Folder className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
```

## 🎯 Component: DropZone

**File**: `src/renderer/src/components/file-manager/DropZone.tsx`

```typescript
import { Upload } from 'lucide-react'
import { UploadProgress } from '@/types/fileManager'

interface DropZoneProps {
  isDragging: boolean
  isUploading: boolean
  uploadProgress: UploadProgress[]
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  children: React.ReactNode
}

export function DropZone({
  isDragging,
  isUploading,
  uploadProgress,
  onDragOver,
  onDragLeave,
  onDrop,
  children
}: DropZoneProps) {
  return (
    <div
      className="relative flex-1 overflow-auto rounded-lg border"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}

      {isDragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm">
          <div className="rounded-lg border-2 border-dashed border-primary bg-background/90 p-8 text-center">
            <Upload className="mx-auto mb-4 h-12 w-12 text-primary" />
            <p className="text-lg font-medium">Drop files to upload</p>
            <p className="text-sm text-muted-foreground">
              Allowed: PDF, DOC, DOCX, PNG, JPG, GIF, WebP
            </p>
          </div>
        </div>
      )}

      {isUploading && uploadProgress.length > 0 && (
        <div className="absolute bottom-4 right-4 w-64 rounded-lg border bg-background p-4 shadow-lg">
          <h3 className="mb-2 font-medium">Uploading files...</h3>
          {uploadProgress.map((progress, idx) => (
            <div key={idx} className="mb-2 text-sm">
              <div className="flex justify-between">
                <span className="truncate">{progress.fileName}</span>
                <span>{progress.percent}%</span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## ❓ Component: ConflictDialog

**File**: `src/renderer/src/components/file-manager/ConflictDialog.tsx`

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RenameConflict, ConflictResolution } from '@/types/fileManager'

interface ConflictDialogProps {
  open: boolean
  conflict: RenameConflict | null
  onResolve: (resolution: ConflictResolution) => void
  onCancel: () => void
}

export function ConflictDialog({ open, conflict, onResolve, onCancel }: ConflictDialogProps) {
  if (!conflict) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File Already Exists</DialogTitle>
          <DialogDescription>
            A file named <strong>{conflict.newName}</strong> already exists in this location.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            What would you like to do?
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <Button variant="outline" onClick={() => onResolve('keep-both')}>
            Keep Both
            <span className="ml-1 text-xs text-muted-foreground">(add suffix)</span>
          </Button>

          <Button variant="destructive" onClick={() => onResolve('overwrite')}>
            Overwrite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## 🎨 Refactored FileManagerPage

**File**: `src/renderer/src/pages/FileManagerPage.tsx` (rename from FilesPage.tsx)

```typescript
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Folder } from 'lucide-react'
import { Toaster, toast } from 'sonner'

import { Toolbar } from '@/components/file-manager/Toolbar'
import { Breadcrumbs, BreadcrumbItem } from '@/components/file-manager/Breadcrumbs'
import { FileList } from '@/components/file-manager/FileList'
import { DropZone } from '@/components/file-manager/DropZone'
import { ConflictDialog } from '@/components/file-manager/ConflictDialog'

import { useDirectory } from '@/hooks/file-manager/useDirectory'
import { useFileOps } from '@/hooks/file-manager/useFileOps'
import { useDnD } from '@/hooks/file-manager/useDnD'

import { RenameConflict, ConflictResolution } from '@/types/fileManager'
import { logger } from '@/utils/logger'

export default function FileManagerPage() {
  // Root and navigation state
  const [rootPath, setRootPath] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string>('')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  // UI state
  const [showHidden, setShowHidden] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [clipboard, setClipboard] = useState<{ paths: string[]; operation: 'copy' | 'move' } | null>(null)

  // Dialog state
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false)
  const [currentConflict, setCurrentConflict] = useState<RenameConflict | null>(null)
  const [conflictResolveCallback, setConflictResolveCallback] = useState<((resolution: ConflictResolution) => void) | null>(null)

  // Custom hooks
  const { files, loading, refresh } = useDirectory(currentPath, {
    showHidden,
    sortBy: 'name',
    sortDirection: 'asc',
    searchQuery: searchQuery || undefined
  })

  const { rename, remove, copy, move, createFolder } = useFileOps({
    currentPath,
    onRefresh: refresh,
    onError: (msg) => toast.error(msg),
    onSuccess: (msg) => toast.success(msg)
  })

  const {
    isDragging,
    isUploading,
    uploadProgress,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDnD({
    currentPath,
    onUploadComplete: refresh,
    onError: (msg) => toast.error(msg),
    onSuccess: (msg) => toast.success(msg)
  })

  // Folder selection
  const selectFolder = async () => {
    try {
      const folder = await window.fileManager.selectFolder()
      if (folder) {
        setRootPath(folder)
        setCurrentPath(folder)
        logger.info('Root folder selected', folder)
      }
    } catch (error: any) {
      toast.error('Failed to select folder')
      logger.error('Failed to select folder', error)
    }
  }

  // Navigation
  const navigateTo = (path: string) => {
    setCurrentPath(path)
    setSelectedFiles(new Set())
  }

  const goToParent = async () => {
    if (!rootPath || currentPath === rootPath) return
    const parent = await window.fileManager.getParentPath(currentPath)
    if (parent && parent.startsWith(rootPath)) {
      navigateTo(parent)
    }
  }

  // Selection
  const toggleSelection = (path: string) => {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(path)) {
      newSelection.delete(path)
    } else {
      newSelection.add(path)
    }
    setSelectedFiles(newSelection)
  }

  // Clipboard operations
  const handleCopy = () => {
    setClipboard({ paths: Array.from(selectedFiles), operation: 'copy' })
  }

  const handleCut = () => {
    setClipboard({ paths: Array.from(selectedFiles), operation: 'move' })
  }

  const handlePaste = async () => {
    if (!clipboard) return

    if (clipboard.operation === 'copy') {
      await copy(clipboard.paths, currentPath)
    } else {
      await move(clipboard.paths, currentPath)
    }

    setClipboard(null)
    setSelectedFiles(new Set())
  }

  // Delete
  const handleDelete = async (toTrash: boolean) => {
    const paths = Array.from(selectedFiles)
    if (paths.length === 0) return

    await remove(paths, toTrash)
    setDeleteDialogOpen(false)
    setSelectedFiles(new Set())
  }

  // New folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    await createFolder(newFolderName)
    setNewFolderDialogOpen(false)
    setNewFolderName('')
  }

  // Rename with conflict handling
  const handleRename = async (oldPath: string, newName: string) => {
    await rename(oldPath, newName, async (conflict) => {
      return new Promise<ConflictResolution>((resolve) => {
        setCurrentConflict(conflict)
        setConflictDialogOpen(true)
        setConflictResolveCallback(() => (resolution: ConflictResolution) => {
          setConflictDialogOpen(false)
          setCurrentConflict(null)
          resolve(resolution)
        })
      })
    })
  }

  // File operations
  const openFile = async (path: string) => {
    try {
      await window.fileManager.openFile(path)
    } catch (error: any) {
      toast.error('Failed to open file')
    }
  }

  const revealInExplorer = async (path: string) => {
    try {
      await window.fileManager.openInExplorer(path)
    } catch (error: any) {
      toast.error('Failed to reveal in explorer')
    }
  }

  // Breadcrumbs
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (!rootPath || !currentPath) return []

    const rel = currentPath.replace(rootPath, '')
    const parts = rel.split(/[/\\]/).filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [{ name: 'Root', path: rootPath }]

    let accumulated = rootPath
    for (const part of parts) {
      accumulated = `${accumulated}/${part}`
      breadcrumbs.push({ name: part, path: accumulated })
    }

    return breadcrumbs
  }

  // No folder selected
  if (!rootPath) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
        <Folder className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">No Folder Selected</h2>
        <p className="text-muted-foreground">Choose a folder to browse files</p>
        <Button onClick={selectFolder} size="lg">
          <Folder className="mr-2 h-4 w-4" />
          Select Folder
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Toaster />

      <Toolbar
        onSelectFolder={selectFolder}
        onNewFolder={() => setNewFolderDialogOpen(true)}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onDelete={() => setDeleteDialogOpen(true)}
        onRefresh={refresh}
        onToggleHidden={() => setShowHidden(!showHidden)}
        showHidden={showHidden}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCount={selectedFiles.size}
        hasClipboard={!!clipboard}
        clipboardOperation={clipboard?.operation}
      />

      <Breadcrumbs items={getBreadcrumbs()} onNavigate={navigateTo} />

      <DropZone
        isDragging={isDragging}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FileList
          files={files}
          loading={loading}
          selectedFiles={selectedFiles}
          onToggleSelection={toggleSelection}
          onNavigate={navigateTo}
          onRename={handleRename}
          onOpenFile={openFile}
          onRevealInExplorer={revealInExplorer}
          canGoUp={currentPath !== rootPath}
          onGoUp={goToParent}
        />
      </DropZone>

      {/* Status bar */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2 text-sm">
        <span>
          {files.length} items {selectedFiles.size > 0 && `(${selectedFiles.size} selected)`}
        </span>
        {clipboard && (
          <span className="text-muted-foreground">
            {clipboard.paths.length} item(s) in clipboard ({clipboard.operation})
          </span>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter a name for the new folder</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Items</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedFiles.size} item(s)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => handleDelete(false)}>
              Delete Permanently
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(true)}>
              Move to Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConflictDialog
        open={conflictDialogOpen}
        conflict={currentConflict}
        onResolve={(resolution) => conflictResolveCallback?.(resolution)}
        onCancel={() => {
          setConflictDialogOpen(false)
          conflictResolveCallback?.('cancel')
        }}
      />
    </div>
  )
}
```

## 📝 Update Routes

In `src/renderer/src/main.tsx`, update the import:

```typescript
// Old
const FilesPage = lazy(() => import('./pages/FilesPage'))

// New
const FileManagerPage = lazy(() => import('./pages/FileManagerPage'))

// And in Routes:
<Route path={ROUTES.FILES} element={<FileManagerPage />} />
```

## ✅ Installation

1. Install sonner for toasts:

   ```bash
   pnpm add sonner
   ```

2. Create all component files in the correct directories

3. Run format:

   ```bash
   pnpm run format
   ```

4. Test:
   ```bash
   pnpm dev
   ```

---

**Status**: Complete component library ready for integration
**Next**: Copy components, test, refine
