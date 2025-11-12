import { useState } from 'react'
import { Button } from '../components/ui/button'
import { IconFolderOpen } from '@tabler/icons-react'
import { Toaster } from 'sonner'
import type { FileItem, BreadcrumbItem } from '../types/fileManager'

// Hooks
import { useDirectory } from '../hooks/file-manager/useDirectory'
import { useFileOps } from '../hooks/file-manager/useFileOps'
import { useDnD } from '../hooks/file-manager/useDnD'
import { useToast } from '../hooks/file-manager/useToast'

// Components
import { Toolbar } from '../components/file-manager/Toolbar'
import { Breadcrumbs } from '../components/file-manager/Breadcrumbs'
import { FileList } from '../components/file-manager/FileList'
import { DropZone } from '../components/file-manager/DropZone'
import { ConflictDialog } from '../components/file-manager/ConflictDialog'

export default function FileManagerPage() {
  // State
  const [rootPath, setRootPath] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [clipboard, setClipboard] = useState<{
    paths: string[]
    operation: 'copy' | 'move'
  } | null>(null)

  const toast = useToast()

  // Directory listing
  const { files, loading, refresh } = useDirectory(currentPath, {
    showHidden: false,
    sortBy: 'name',
    sortDirection: 'asc',
    searchQuery
  })

  // File operations
  const { rename, remove, copy, move, createFolder, renameConflict, resolveConflict } =
    useFileOps(refresh)

  // Drag and drop
  const { isDragging, isUploading, uploadProgress, handleDragOver, handleDragLeave, handleDrop } =
    useDnD(currentPath, refresh)

  // Select folder
  const selectFolder = async () => {
    const folder = await window.fileManager.selectFolder()
    if (folder) {
      setRootPath(folder)
      setCurrentPath(folder)
    }
  }

  // Navigation
  const navigateTo = (path: string) => {
    setCurrentPath(path)
    setSelectedFiles(new Set())
  }

  const goToParent = async () => {
    if (!rootPath || !currentPath || currentPath === rootPath) return
    const parent = await window.fileManager.getParentPath(currentPath)
    navigateTo(parent)
  }

  const handleFileOpen = async (file: FileItem) => {
    if (file.type === 'directory') {
      navigateTo(file.path)
    } else {
      await window.fileManager.openFile(file.path)
    }
  }

  // Breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = (() => {
    if (!rootPath || !currentPath) return []

    const parts: BreadcrumbItem[] = [{ name: 'Home', path: rootPath }]

    if (currentPath !== rootPath) {
      const relativePath = currentPath.replace(rootPath, '').split(/[/\\]/).filter(Boolean)
      let buildPath = rootPath

      for (const part of relativePath) {
        buildPath = `${buildPath}/${part}`
        parts.push({ name: part, path: buildPath })
      }
    }

    return parts
  })()

  // File selection
  const handleFileSelect = (filePath: string, selected: boolean) => {
    const newSelection = new Set(selectedFiles)
    if (selected) {
      newSelection.add(filePath)
    } else {
      newSelection.delete(filePath)
    }
    setSelectedFiles(newSelection)
  }

  // Toolbar actions
  const handleNewFolder = () => {
    const folderName = prompt('Enter folder name:')
    if (folderName && currentPath) {
      createFolder(currentPath, folderName)
    }
  }

  const handleDelete = async () => {
    if (selectedFiles.size === 0) return
    const confirmed = confirm(`Delete ${selectedFiles.size} item(s)?`)
    if (confirmed) {
      await remove(Array.from(selectedFiles), true)
      setSelectedFiles(new Set())
    }
  }

  const handleCopy = () => {
    if (selectedFiles.size > 0) {
      setClipboard({ paths: Array.from(selectedFiles), operation: 'copy' })
      toast.info(`${selectedFiles.size} item(s) copied`)
    }
  }

  const handleCut = () => {
    if (selectedFiles.size > 0) {
      setClipboard({ paths: Array.from(selectedFiles), operation: 'move' })
      toast.info(`${selectedFiles.size} item(s) cut`)
    }
  }

  const handlePaste = async () => {
    if (!clipboard || !currentPath) return

    if (clipboard.operation === 'copy') {
      await copy(clipboard.paths, currentPath)
    } else {
      await move(clipboard.paths, currentPath)
    }

    setClipboard(null)
    setSelectedFiles(new Set())
  }

  // No folder selected
  if (!rootPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <IconFolderOpen size={64} className="text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Folder Selected</h2>
        <p className="text-muted-foreground">Select a folder to get started</p>
        <Button onClick={selectFolder}>
          <IconFolderOpen className="mr-2" size={16} />
          Select Folder
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">File Manager</h1>
          <Button variant="outline" size="sm" onClick={selectFolder}>
            Change Folder
          </Button>
        </div>
        <Breadcrumbs items={breadcrumbs} onNavigate={navigateTo} />
      </div>

      {/* Toolbar */}
      <Toolbar
        selectedCount={selectedFiles.size}
        canPaste={!!clipboard}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewFolder={handleNewFolder}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
      />

      {/* File List with Drag & Drop */}
      <DropZone
        isDragging={isDragging}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <FileList
            files={files}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onFileRename={rename}
            onFileOpen={handleFileOpen}
            onNavigateUp={goToParent}
            canNavigateUp={currentPath !== rootPath}
          />
        )}
      </DropZone>

      {/* Conflict Dialog */}
      <ConflictDialog conflict={renameConflict} onResolve={resolveConflict} />
    </div>
  )
}
