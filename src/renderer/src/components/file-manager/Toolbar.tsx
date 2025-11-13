import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  IconFolderPlus,
  IconTrash,
  IconCopy,
  IconCut,
  IconClipboard,
  IconSearch,
  IconRefresh
} from '@tabler/icons-react'

interface ToolbarProps {
  selectedCount: number
  canPaste: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onNewFolder: () => void
  onDelete: () => void
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
  onRefresh: () => void
}

export function Toolbar({
  selectedCount,
  canPaste,
  searchQuery,
  onSearchChange,
  onNewFolder,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onRefresh
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-b">
      <Button size="sm" variant="outline" onClick={onNewFolder}>
        <IconFolderPlus size={16} />
        <span className="ml-1">New Folder</span>
      </Button>

      <Button size="sm" variant="outline" onClick={onRefresh} title="Refresh">
        <IconRefresh size={16} />
      </Button>

      <div className="w-px h-6 bg-border" />

      <Button size="sm" variant="outline" disabled={selectedCount === 0} onClick={onCopy}>
        <IconCopy size={16} />
      </Button>

      <Button size="sm" variant="outline" disabled={selectedCount === 0} onClick={onCut}>
        <IconCut size={16} />
      </Button>

      <Button size="sm" variant="outline" disabled={!canPaste} onClick={onPaste}>
        <IconClipboard size={16} />
      </Button>

      <Button
        size="sm"
        variant="outline"
        disabled={selectedCount === 0}
        onClick={onDelete}
        className="text-destructive"
      >
        <IconTrash size={16} />
      </Button>

      <div className="flex-1" />

      <div className="relative w-64">
        <IconSearch
          size={16}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  )
}
