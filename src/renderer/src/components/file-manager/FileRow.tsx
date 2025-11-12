import { useState, useEffect, useRef } from 'react'
import { IconFile, IconFolder } from '@tabler/icons-react'
import type { FileItem } from '../../types/fileManager'
import { Checkbox } from '../ui/checkbox'
import { formatFileSize, formatDate } from '../../lib/utils'

interface FileRowProps {
  file: FileItem
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onRename: (newName: string) => void
  onOpen: () => void
}

export function FileRow({ file, isSelected, onSelect, onRename, onOpen }: FileRowProps) {
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
    if (editValue.trim() && editValue !== file.name) {
      // For files, add back the extension if not present
      let finalName = editValue.trim()

      if (file.type === 'file' && file.extension) {
        const ext = `.${file.extension}`
        if (!finalName.endsWith(ext)) {
          finalName += ext
        }
      }

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
    <tr
      ref={rowRef}
      className={`hover:bg-muted/50 cursor-pointer ${isSelected ? 'bg-muted' : ''}`}
      onClick={(e) => {
        if (e.detail === 2 && !isRenaming) {
          // Double click
          if (file.type === 'directory') {
            onOpen()
          } else {
            handleStartRename()
          }
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
    </tr>
  )
}
