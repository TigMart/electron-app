import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { IconFolderOpen } from '@tabler/icons-react'
import type { FileItem, BreadcrumbItem } from '../../types/fileManager'
import { logger } from '../../utils/logger'
import { useTranslation } from 'react-i18next'

// Hooks
import { useDirectory } from '../../hooks/file-manager/useDirectory'
import { useFileOps } from '../../hooks/file-manager/useFileOps'
import { useDnD } from '../../hooks/file-manager/useDnD'
import { useToast } from '../../hooks/useToast'

// Components
import { Toolbar } from '../../components/file-manager/Toolbar'
import { Breadcrumbs } from '../../components/file-manager/Breadcrumbs'
import { FileList } from '../../components/file-manager/FileList'
import { DropZone } from '../../components/file-manager/DropZone'
import { ConflictDialog } from '../../components/file-manager/ConflictDialog'
import { NewFolderDialog } from '../../components/file-manager/NewFolderDialog'
import { DeleteConfirmDialog } from '../../components/file-manager/DeleteConfirmDialog'
import { AlertDialog } from '../../components/file-manager/AlertDialog'
import { UploadProgressDialog } from '../../components/file-manager/UploadProgressDialog'

export default function FileManagerPage() {
  const { t } = useTranslation()

  // State
  const [rootPath, setRootPath] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [clipboard, setClipboard] = useState<{
    paths: string[]
    operation: 'copy' | 'move'
  } | null>(null)
  const [isPasting, setIsPasting] = useState(false)
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [dialogKey, setDialogKey] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [filesToDelete, setFilesToDelete] = useState<string[]>([])
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [alertInfo, setAlertInfo] = useState<{
    title: string
    message: string
    details?: string
  }>({
    title: '',
    message: '',
    details: ''
  })

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
  const {
    isDragging,
    isUploading,
    uploadProgress,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDnD(currentPath, refresh)

  // Select folder
  const selectFolder = async () => {
    logger.debug('selectFolder called')
    try {
      const folder = await window.fileManager.selectFolder()
      logger.debug('Selected folder:', folder)
      if (folder) {
        setRootPath(folder)
        setCurrentPath(folder)
        logger.debug('Root and current path set to:', folder)
      } else {
        logger.debug('No folder selected (user cancelled)')
      }
    } catch (error) {
      console.error('[DEBUG] Error selecting folder:', error)
      toast.error('Failed to select folder: ' + (error as Error).message)
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
    logger.debug('handleNewFolder called')
    setDialogKey((prev) => prev + 1)
    setNewFolderDialogOpen(true)
  }

  const handleDelete = () => {
    logger.debug('handleDelete called, selectedFiles.size:', selectedFiles.size)
    if (selectedFiles.size === 0) return
    setFilesToDelete(Array.from(selectedFiles))
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    logger.debug('Calling remove for:', filesToDelete)
    await remove(filesToDelete, true)
    setSelectedFiles(new Set())
    setFilesToDelete([])
  }

  const handleCopy = () => {
    logger.debug('handleCopy called, selectedFiles.size:', selectedFiles.size)
    if (selectedFiles.size > 0) {
      setClipboard({ paths: Array.from(selectedFiles), operation: 'copy' })
      toast.info(`${selectedFiles.size} item(s) copied`)
    }
  }

  const handleCut = () => {
    logger.debug('handleCut called, selectedFiles.size:', selectedFiles.size)
    if (selectedFiles.size > 0) {
      setClipboard({ paths: Array.from(selectedFiles), operation: 'move' })
      toast.info(`${selectedFiles.size} item(s) cut`)
    }
  }

  const handlePaste = async () => {
    if (isPasting) {
      logger.debug('Already pasting, ignoring duplicate call')
      return
    }

    if (!clipboard || !currentPath) {
      logger.debug('No clipboard or currentPath, aborting')
      return
    }

    try {
      setIsPasting(true)

      // Only validate: Don't paste a folder into itself (subfolder check)
      for (const sourcePath of clipboard.paths) {
        const normalizedSource = sourcePath.replace(/\\/g, '/').toLowerCase()
        const normalizedDest = currentPath.replace(/\\/g, '/').toLowerCase()

        // Check if destination is inside the source folder
        if (
          normalizedDest.startsWith(normalizedSource + '/') ||
          normalizedDest === normalizedSource
        ) {
          const folderName = sourcePath.split(/[\\/]/).pop() || sourcePath

          setAlertInfo({
            title: '1 Interrupted Action',
            message: 'The destination folder is a subfolder of the source folder.',
            details: folderName
          })
          setAlertDialogOpen(true)
          logger.debug('Prevented paste into subfolder')
          return
        }
      }

      const clipboardCopy = { ...clipboard }
      setClipboard(null)
      setSelectedFiles(new Set())

      if (clipboardCopy.operation === 'copy') {
        await copy(clipboardCopy.paths, currentPath)
      } else {
        await move(clipboardCopy.paths, currentPath)
      }
    } finally {
      setIsPasting(false)
    }
  }

  // No folder selected
  if (!rootPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <IconFolderOpen size={64} className="text-muted-foreground" />
        <h2 className="text-2xl font-semibold">{t('FileManager.noFolderSelected')}</h2>
        <p className="text-muted-foreground">{t('FileManager.selectFolderPrompt')}</p>
        <Button onClick={selectFolder}>
          <IconFolderOpen className="mr-2" size={16} />
          {t('FileManager.selectFolder')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
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
        onRefresh={refresh}
      />

      {/* File List with Drag & Drop */}
      <DropZone
        isDragging={isDragging}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">{t('Common.loading')}</p>
          </div>
        ) : (
          <FileList
            files={files}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onFileRename={rename}
            onFileOpen={handleFileOpen}
            onFileDelete={(filePath) => remove([filePath], true)}
            onFileCopy={(filePath) => {
              setClipboard({ paths: [filePath], operation: 'copy' })
              toast.info('1 item copied')
            }}
            onFileCut={(filePath) => {
              setClipboard({ paths: [filePath], operation: 'move' })
              toast.info('1 item cut')
            }}
            onFileEditTemplate={() => {}}
            onFileOpenExternal={(filePath) => window.fileManager.openFile(filePath)}
            onFileOpenInExplorer={(filePath) => window.fileManager.openInExplorer(filePath)}
            onNavigateUp={goToParent}
            canNavigateUp={currentPath !== rootPath}
          />
        )}
      </DropZone>

      {/* Conflict Dialog */}
      <ConflictDialog conflict={renameConflict} onResolve={resolveConflict} />

      {/* New Folder Dialog */}
      <NewFolderDialog
        key={dialogKey}
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onConfirm={async (folderName) => {
          if (currentPath) {
            await createFolder(currentPath, folderName)
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemCount={filesToDelete.length}
      />

      {/* Alert Dialog */}
      <AlertDialog
        open={alertDialogOpen}
        onOpenChange={setAlertDialogOpen}
        title={alertInfo.title}
        message={alertInfo.message}
        details={alertInfo.details}
      />

      {/* Upload Progress Dialog */}
      <UploadProgressDialog open={isUploading} uploadProgress={uploadProgress} />
    </div>
  )
}
