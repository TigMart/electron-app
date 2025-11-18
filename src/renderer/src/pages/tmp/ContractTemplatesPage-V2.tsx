import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { IconFolderOpen } from '@tabler/icons-react'
import type { FileItem, BreadcrumbItem } from '@/types/fileManager'
import { logger } from '../../utils/logger'
import { useTranslation } from 'react-i18next'

// Services
import { getSettings } from '@/services/settings.service'

// Hooks
import { useDirectory } from '@/hooks/file-manager/useDirectory'
import { useFileOps } from '@/hooks/file-manager/useFileOps'
import { useDnD } from '@/hooks/file-manager/useDnD'
import { useToast } from '@/hooks/useToast'

// Components
import { Toolbar } from '@/components/file-manager/Toolbar'
import { Breadcrumbs } from '@/components/file-manager/Breadcrumbs'
import { FileList } from '@/components/file-manager/FileList'
import { DropZone } from '@/components/file-manager/DropZone'
import { ConflictDialog } from '@/components/file-manager/ConflictDialog'
import { NewFolderDialog } from '@/components/file-manager/NewFolderDialog'
import { DeleteConfirmDialog } from '@/components/file-manager/DeleteConfirmDialog'
import { ContractTemplateForm } from '@/components/tmp/contract-template-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog } from '@/components/file-manager/AlertDialog'
import { UploadProgressDialog } from '@/components/file-manager/UploadProgressDialog'

export default function ContractTemplatesPage() {
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
  const [newTemplateDialogOpen, setNewTemplateDialogOpen] = useState(false)
  const [editTemplateDialogOpen, setEditTemplateDialogOpen] = useState(false)
  const [selectedTemplateFile, setSelectedTemplateFile] = useState<string | null>(null)
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

  // Directory listing - show ALL files for navigation
  const { files, loading, refresh } = useDirectory(currentPath, {
    showHidden: false,
    sortBy: 'name',
    sortDirection: 'asc',
    searchQuery
  })

  // Filter to show only directories and .docx files
  const filteredFiles = files.filter(
    (file) => file.type === 'directory' || file.name.toLowerCase().endsWith('.docx')
  )

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

  // Load root path from settings on mount - ONLY ONCE
  useEffect(() => {
    const loadRootPathFromSettings = async () => {
      try {
        logger.debug('=== Loading root path from settings (MOUNT) ===')
        const settings = await getSettings()
        if (settings.contract_templates_dir) {
          logger.debug('=== Setting root path:', settings.contract_templates_dir)
          // Set root path in main process so file operations work
          await window.fileManager.setRootPath(settings.contract_templates_dir)
          setRootPath(settings.contract_templates_dir)
          setCurrentPath(settings.contract_templates_dir)
        }
      } catch (err) {
        toast.error('Failed to load settings: ' + (err as Error).message)
      }
    }

    loadRootPathFromSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - run only on mount

  // Log when currentPath changes
  useEffect(() => {
    logger.debug('=== ✅ CURRENT PATH CHANGED ===')
    logger.debug('New currentPath:', currentPath)
    logger.debug('Files count:', files.length)
    logger.debug('Loading:', loading)
    logger.debug('================================')
  }, [currentPath, files.length, loading])

  // Navigate to settings
  const goToSettings = () => {
    window.location.hash = '/settings'
  }

  // Navigation
  const navigateTo = (path: string) => {
    logger.debug('=== NAVIGATE TO CALLED ===')
    logger.debug('Target path:', path)
    logger.debug('Current rootPath:', rootPath)
    logger.debug('Current currentPath:', currentPath)
    setCurrentPath(path)
    setSelectedFiles(new Set())
    logger.debug('=== setCurrentPath called with:', path)
  }

  const goToParent = async () => {
    if (!rootPath || !currentPath || currentPath === rootPath) return
    const parent = await window.fileManager.getParentPath(currentPath)
    navigateTo(parent)
  }

  const handleFileOpen = async (file: FileItem) => {
    try {
      logger.debug('=== HANDLE FILE OPEN ===')
      logger.debug('File:', file.name)
      logger.debug('Type:', file.type)
      logger.debug('Path:', file.path)

      if (file.type === 'directory') {
        logger.debug('=== This is a DIRECTORY, navigating... ===')
        navigateTo(file.path)
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        logger.debug('=== This is a DOCX file, opening in Word... ===')
        await window.fileManager.openFile(file.path)
      }
    } catch (error) {
      logger.error('Failed to open file:', error)
      toast.error('Failed to open: ' + (error as Error).message)
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

  const handleNewTemplate = () => {
    logger.debug('handleNewTemplate called')
    setSelectedTemplateFile(null)
    setNewTemplateDialogOpen(true)
  }

  const handleEditTemplateInfo = (filePath: string) => {
    logger.debug('handleEditTemplateInfo called for:', filePath)
    // filePath from FileList is absolute, we need to convert to relative for the form
    if (rootPath) {
      const relativePath = filePath.substring(rootPath.length).replace(/^[/\\]/, '')
      setSelectedTemplateFile(relativePath)
    } else {
      setSelectedTemplateFile(filePath)
    }
    setEditTemplateDialogOpen(true)
  }

  const handleTemplateFormSuccess = () => {
    setNewTemplateDialogOpen(false)
    setEditTemplateDialogOpen(false)
    setSelectedTemplateFile(null)
    refresh()
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
        <h2 className="text-2xl font-semibold">{t('ContractTemplates.noRootDirectory')}</h2>
        <p className="text-muted-foreground">{t('ContractTemplates.configureInSettings')}</p>
        <Button onClick={goToSettings}>
          <IconFolderOpen className="mr-2" size={16} />
          {t('Navigation.Settings')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">{t('ContractTemplates.title')}</h1>
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={handleNewTemplate}>
              {t('ContractTemplates.newTemplate')}
            </Button>
            {selectedFiles.size === 1 &&
              Array.from(selectedFiles)[0].toLowerCase().endsWith('.docx') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditTemplateInfo(Array.from(selectedFiles)[0])}
                >
                  {t('ContractTemplates.editInfo')}
                </Button>
              )}
            <Button variant="outline" size="sm" onClick={goToSettings}>
              {t('Navigation.Settings')}
            </Button>
          </div>
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
            files={filteredFiles}
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
            onFileEditTemplate={(filePath) => handleEditTemplateInfo(filePath)}
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

      {/* New/Edit Template Dialog */}
      <Dialog
        open={newTemplateDialogOpen || editTemplateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setNewTemplateDialogOpen(false)
            setEditTemplateDialogOpen(false)
            setSelectedTemplateFile(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplateFile
                ? t('ContractTemplates.editInfo')
                : t('ContractTemplates.newTemplate')}
            </DialogTitle>
          </DialogHeader>
          <ContractTemplateForm
            initialFilePath={selectedTemplateFile}
            currentDirectory={currentPath}
            onSuccess={handleTemplateFormSuccess}
            onCancel={() => {
              setNewTemplateDialogOpen(false)
              setEditTemplateDialogOpen(false)
              setSelectedTemplateFile(null)
            }}
          />
        </DialogContent>
      </Dialog>

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
