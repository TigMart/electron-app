import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface FileExistsDialogProps {
  fileName: string
  type: 'file_import' | 'template_name'
  open: boolean
  onResolve: (action: 'replace' | 'keep-both' | 'cancel') => void
}

export function FileExistsDialog({ fileName, type, open, onResolve }: FileExistsDialogProps) {
  const { t } = useTranslation()

  const getTitle = () => {
    return type === 'file_import'
      ? t('ContractTemplates.fileAlreadyExists')
      : t('ContractTemplates.templateNameConflict')
  }

  const getDescription = () => {
    return type === 'file_import'
      ? t('ContractTemplates.fileExistsMessage', { fileName })
      : t('ContractTemplates.templateNameConflictMessage', { fileName })
  }

  return (
    <Dialog open={open} onOpenChange={() => onResolve('cancel')}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-4">
          <div className="text-muted-foreground text-sm">
            {t('ContractTemplates.fileName')}: <span className="font-medium">{fileName}</span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={() => onResolve('replace')} variant="destructive" className="w-full">
            {t('Common.replace')}
          </Button>
          <Button onClick={() => onResolve('keep-both')} variant="outline" className="w-full">
            {t('Common.keepBoth')}
          </Button>
          <Button onClick={() => onResolve('cancel')} variant="ghost" className="w-full">
            {t('Common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
