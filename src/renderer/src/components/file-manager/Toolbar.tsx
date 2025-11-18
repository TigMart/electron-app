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
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-2 p-2 border-b">
      <Button size="sm" variant="outline" onClick={onNewFolder}>
        <IconFolderPlus size={16} />
        <span className="ml-1">{t('FileManager.newFolder')}</span>
      </Button>

      <Button size="sm" variant="outline" onClick={onRefresh} title={t('FileManager.refresh')}>
        <IconRefresh size={16} />
      </Button>

      <div className="w-px h-6 bg-border" />

      <Button
        size="sm"
        variant="outline"
        onClick={onCopy}
        disabled={selectedCount === 0}
        title={t('FileManager.copy')}
      >
        <IconCopy size={16} />
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={onCut}
        disabled={selectedCount === 0}
        title={t('FileManager.cut')}
      >
        <IconCut size={16} />
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={onPaste}
        disabled={!canPaste}
        title={t('FileManager.paste')}
      >
        <IconClipboard size={16} />
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={onDelete}
        disabled={selectedCount === 0}
        className="text-destructive"
        title={t('Common.delete')}
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
          type="text"
          placeholder={t('FileManager.search')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  )
}
