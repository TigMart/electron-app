import { useState, useEffect, useRef } from 'react'
import {
  IconFile,
  IconFolder,
  IconPencil,
  IconTrash,
  IconCopy,
  IconCut,
  IconDotsVertical,
  IconExternalLink,
  IconFolderOpen
} from '@tabler/icons-react'
import type { FileItem } from '@/types/fileManager'
import { Checkbox } from '@/components/ui/checkbox'
import { formatFileSize, formatDate } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'

interface FileRowProps {
  file: FileItem
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onRename: (newName: string) => void
  onOpen: () => void
  onDelete?: () => void
  onCopy?: () => void
  onCut?: () => void
  onEditTemplate?: () => void
  onOpenExternal?: () => void
  onOpenInExplorer?: () => void
}

export function FileRow({
  file,
  isSelected,
  onSelect,
  onRename,
  onOpen,
  onDelete,
  onCopy,
  onCut,
  onEditTemplate,
  onOpenExternal,
  onOpenInExplorer
}: FileRowProps) {
  const { t } = useTranslation()
  const [isRenaming, setIsRenaming] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const rowRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()

      // Select filename without extension
      const ext = file.extension ? `.${file.extension}` : ''
      const nameWithoutExt = file.name.slice(0, file.name.length - ext.length)
      inputRef.current.setSelectionRange(0, nameWithoutExt.length)
    }
  }, [isRenaming, file.name, file.extension])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected && e.key === 'F2' && !isRenaming) {
        e.preventDefault()
        handleStartRename()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelected, isRenaming])

  const handleStartRename = () => {
    if (file.type === 'directory') {
      setEditValue(file.name)
    } else {
      // Remove extension for files
      const ext = file.extension ? `.${file.extension}` : ''
      const nameWithoutExt = file.name.slice(0, file.name.length - ext.length)
      setEditValue(nameWithoutExt)
    }
    setIsRenaming(true)
  }

  const handleConfirmRename = () => {
    const trimmedValue = editValue.trim()

    // For files, add back the extension if not present
    let finalName = trimmedValue
    if (file.type === 'file' && file.extension) {
      const ext = `.${file.extension}`
      if (!finalName.endsWith(ext)) {
        finalName += ext
      }
    }

    // Only rename if name actually changed
    if (trimmedValue && finalName !== file.name) {
      onRename(finalName)
    }

    setIsRenaming(false)
  }

  const handleCancelRename = () => {
    setIsRenaming(false)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirmRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelRename()
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <tr
          ref={rowRef}
          className={`hover:bg-muted/50 cursor-pointer ${isSelected ? 'bg-muted' : ''}`}
          onClick={(e) => {
            if (e.detail === 2 && !isRenaming) {
              onOpen()
            }
          }}
        >
          <td className="p-2 w-8">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              onClick={(e) => e.stopPropagation()}
            />
          </td>

          <td className="p-2">
            <div className="flex items-center gap-2">
              {file.type === 'directory' ? (
                <IconFolder size={20} className="text-blue-500 shrink-0" />
              ) : (
                <IconFile size={20} className="text-muted-foreground shrink-0" />
              )}

              {isRenaming ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleConfirmRename}
                  onClick={(e) => e.stopPropagation()}
                  className="px-1 py-0 border rounded text-sm flex-1 min-w-0"
                />
              ) : (
                <span className="truncate">{file.name}</span>
              )}
            </div>
          </td>

          <td className="p-2 text-sm text-muted-foreground">{file.type}</td>

          <td className="p-2 text-sm text-muted-foreground">
            {file.type === 'file' ? formatFileSize(file.size) : '—'}
          </td>

          <td className="p-2 text-sm text-muted-foreground">{formatDate(file.modified)}</td>

          <td className="p-2 w-12">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconDotsVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartRename()
                  }}
                >
                  <IconPencil size={16} className="mr-2" />
                  {t('FileManager.rename')}
                </DropdownMenuItem>
                {onCopy && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onCopy()
                    }}
                  >
                    <IconCopy size={16} className="mr-2" />
                    {t('FileManager.copy')}
                  </DropdownMenuItem>
                )}
                {onCut && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onCut()
                    }}
                  >
                    <IconCut size={16} className="mr-2" />
                    {t('FileManager.cut')}
                  </DropdownMenuItem>
                )}
                {onOpenExternal && file.type === 'file' && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenExternal()
                    }}
                  >
                    <IconExternalLink size={16} className="mr-2" />
                    {t('FileManager.openFile')}
                  </DropdownMenuItem>
                )}
                {onEditTemplate && file.type !== 'directory' && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditTemplate()
                    }}
                  >
                    <Edit size={16} className="mr-2" />
                    {t('ContractTemplates.editInfo')}
                  </DropdownMenuItem>
                )}
                {onOpenInExplorer && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenInExplorer()
                    }}
                  >
                    <IconFolderOpen size={16} className="mr-2" />
                    {t('FileManager.openInExplorer')}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                      }}
                      className="text-destructive"
                    >
                      <IconTrash size={16} className="mr-2" />
                      {t('Common.delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </td>
        </tr>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={handleStartRename}>
          <IconPencil size={16} className="mr-2" />
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        {onCopy && (
          <ContextMenuItem onClick={onCopy}>
            <IconCopy size={16} className="mr-2" />
            Copy
          </ContextMenuItem>
        )}
        {onCut && (
          <ContextMenuItem onClick={onCut}>
            <IconCut size={16} className="mr-2" />
            Cut
          </ContextMenuItem>
        )}
        {onOpenExternal && file.type === 'file' && (
          <ContextMenuItem onClick={onOpenExternal}>
            <IconExternalLink size={16} className="mr-2" />
            Open
          </ContextMenuItem>
        )}
        {onOpenInExplorer && (
          <ContextMenuItem onClick={onOpenInExplorer}>
            <IconFolderOpen size={16} className="mr-2" />
            Show in Explorer
          </ContextMenuItem>
        )}
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDelete} className="text-destructive">
              <IconTrash size={16} className="mr-2" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
