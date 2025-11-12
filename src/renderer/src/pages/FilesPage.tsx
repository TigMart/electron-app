import { useState, useEffect, useCallback } from 'react'
import {
  Folder,
  File,
  FolderPlus,
  Trash2,
  Copy,
  Move,
  Search,
  Eye,
  EyeOff,
  Home,
  ChevronRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { FileItem, ListOptions } from '@/types/fileManager'
import { logger } from '@/utils/logger'

export default function FilesPage() {
  const [rootPath, setRootPath] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string>('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [clipboard, setClipboard] = useState<{
    paths: string[]
    operation: 'copy' | 'move'
  } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // Select root folder
  const selectFolder = async () => {
    try {
      const folder = await window.fileManager.selectFolder()
      if (folder) {
        setRootPath(folder)
        setCurrentPath(folder)
        logger.info('Root folder selected', folder)
      }
    } catch (error) {
      logger.error('Failed to select folder', error)
      alert('Failed to select folder')
    }
  }

  // Load files
  const loadFiles = useCallback(async () => {
    if (!currentPath) return

    setLoading(true)
    try {
      const listOptions: ListOptions = {
        showHidden,
        sortBy: 'name',
        sortDirection: 'asc',
        searchQuery: searchQuery || undefined
      }
      const items = await window.fileManager.listFiles(currentPath, listOptions)
      setFiles(items)
      logger.debug(`Loaded ${items.length} files from ${currentPath}`)
    } catch (error) {
      logger.error('Failed to load files', error)
      alert('Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [currentPath, showHidden, searchQuery])

  useEffect(() => {
    if (currentPath) {
      loadFiles()
    }
  }, [currentPath, loadFiles])

  // Navigate to folder
  const navigateTo = async (path: string) => {
    setCurrentPath(path)
    setSelectedFiles(new Set())
  }

  // Go to parent folder
  const goToParent = async () => {
    if (!rootPath || currentPath === rootPath) return
    const parent = await window.fileManager.getParentPath(currentPath)
    if (parent && parent.startsWith(rootPath)) {
      navigateTo(parent)
    }
  }

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      await window.fileManager.createFolder(currentPath, newFolderName)
      setNewFolderDialogOpen(false)
      setNewFolderName('')
      await loadFiles()
      logger.info('Folder created', newFolderName)
    } catch (error) {
      logger.error('Failed to create folder', error)
      alert('Failed to create folder')
    }
  }

  // Delete selected files
  const handleDelete = async (toTrash: boolean) => {
    const paths = Array.from(selectedFiles)
    if (paths.length === 0) return

    try {
      await window.fileManager.remove(paths, { toTrash })
      setDeleteDialogOpen(false)
      setSelectedFiles(new Set())
      await loadFiles()
      logger.info(`Deleted ${paths.length} items`, { toTrash })
    } catch (error) {
      logger.error('Failed to delete', error)
      alert('Failed to delete files')
    }
  }

  // Copy/Move operations
  const handleCopy = () => {
    setClipboard({ paths: Array.from(selectedFiles), operation: 'copy' })
    logger.debug('Copied to clipboard', Array.from(selectedFiles))
  }

  const handleCut = () => {
    setClipboard({ paths: Array.from(selectedFiles), operation: 'move' })
    logger.debug('Cut to clipboard', Array.from(selectedFiles))
  }

  const handlePaste = async () => {
    if (!clipboard) return

    try {
      if (clipboard.operation === 'copy') {
        await window.fileManager.copy(clipboard.paths, currentPath)
      } else {
        await window.fileManager.move(clipboard.paths, currentPath)
      }
      setClipboard(null)
      setSelectedFiles(new Set())
      await loadFiles()
      logger.info('Paste completed', clipboard.operation)
    } catch (error) {
      logger.error('Failed to paste', error)
      alert('Failed to paste files')
    }
  }

  // Open file with default app
  const openFile = async (path: string) => {
    try {
      await window.fileManager.openFile(path)
      logger.info('Opened file', path)
    } catch (error) {
      logger.error('Failed to open file', error)
      alert('Failed to open file')
    }
  }

  // Reveal in explorer
  const revealInExplorer = async (path: string) => {
    try {
      await window.fileManager.openInExplorer(path)
      logger.info('Revealed in explorer', path)
    } catch (error) {
      logger.error('Failed to reveal in explorer', error)
    }
  }

  // Toggle file selection
  const toggleSelection = (path: string) => {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(path)) {
      newSelection.delete(path)
    } else {
      newSelection.add(path)
    }
    setSelectedFiles(newSelection)
  }

  // Get breadcrumbs
  const getBreadcrumbs = () => {
    if (!rootPath || !currentPath) return []
    const rel = currentPath.replace(rootPath, '')
    const parts = rel.split(/[/\\]/).filter(Boolean)
    const breadcrumbs = [{ name: 'Root', path: rootPath }]

    let accumulated = rootPath
    for (const part of parts) {
      accumulated = `${accumulated}/${part}`
      breadcrumbs.push({ name: part, path: accumulated })
    }

    return breadcrumbs
  }

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

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2">
        <Button onClick={selectFolder} variant="outline" size="sm">
          <Folder className="mr-2 h-4 w-4" />
          Choose Folder
        </Button>
        <div className="h-6 w-px bg-border" />
        <Button onClick={() => setNewFolderDialogOpen(true)} variant="outline" size="sm">
          <FolderPlus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          disabled={selectedFiles.size === 0}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>
        <Button onClick={handleCut} variant="outline" size="sm" disabled={selectedFiles.size === 0}>
          <Move className="mr-2 h-4 w-4" />
          Cut
        </Button>
        <Button onClick={handlePaste} variant="outline" size="sm" disabled={!clipboard}>
          Paste
        </Button>
        <Button
          onClick={() => setDeleteDialogOpen(true)}
          variant="outline"
          size="sm"
          disabled={selectedFiles.size === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <div className="h-6 w-px bg-border" />
        <Button onClick={loadFiles} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <Button
          onClick={() => setShowHidden(!showHidden)}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <Button onClick={() => navigateTo(rootPath)} variant="ghost" size="sm">
          <Home className="h-4 w-4" />
        </Button>
        {breadcrumbs.slice(1).map((crumb) => (
          <div key={crumb.path} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Button
              onClick={() => navigateTo(crumb.path)}
              variant="ghost"
              size="sm"
              className="font-normal"
            >
              {crumb.name}
            </Button>
          </div>
        ))}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto rounded-lg border">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Folder className="h-12 w-12" />
            <p>No files found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-muted">
              <tr className="border-b text-left text-sm">
                <th className="p-2 w-12"></th>
                <th className="p-2">Name</th>
                <th className="p-2 w-32">Type</th>
                <th className="p-2 w-32">Size</th>
                <th className="p-2 w-48">Modified</th>
                <th className="p-2 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPath !== rootPath && (
                <tr className="cursor-pointer border-b hover:bg-muted/50" onClick={goToParent}>
                  <td className="p-2"></td>
                  <td className="p-2 flex items-center gap-2">
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
                <tr
                  key={file.path}
                  className={`cursor-pointer border-b hover:bg-muted/50 ${
                    selectedFiles.has(file.path) ? 'bg-accent' : ''
                  }`}
                  onClick={() => {
                    if (file.type === 'directory') {
                      navigateTo(file.path)
                    }
                  }}
                >
                  <td className="p-2">
                    <Checkbox
                      checked={selectedFiles.has(file.path)}
                      onCheckedChange={() => toggleSelection(file.path)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {file.type === 'directory' ? (
                        <Folder className="h-4 w-4 text-blue-500" />
                      ) : (
                        <File className="h-4 w-4" />
                      )}
                      <span className={file.isHidden ? 'text-muted-foreground' : ''}>
                        {file.name}
                      </span>
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
                        <Button
                          onClick={() => openFile(file.path)}
                          variant="ghost"
                          size="sm"
                          title="Open"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => revealInExplorer(file.path)}
                        variant="ghost"
                        size="sm"
                        title="Reveal in Explorer"
                      >
                        <Folder className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
