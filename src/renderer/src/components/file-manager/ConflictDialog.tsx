import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { RenameConflict, ConflictResolution } from '@/types/fileManager'
import { useTranslation } from 'react-i18next'

interface ConflictDialogProps {
  conflict: RenameConflict | null
  onResolve: (resolution: ConflictResolution) => void
}

export function ConflictDialog({ conflict, onResolve }: ConflictDialogProps) {
  const { t } = useTranslation()

  if (!conflict) return null

  return (
    <Dialog open={!!conflict} onOpenChange={() => onResolve('cancel')}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('ContractTemplates.fileAlreadyExists')}</DialogTitle>
          <DialogDescription>
            {t('ContractTemplates.fileExistsAtLocation', { name: conflict.newName })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">{t('ContractTemplates.whatToDo')}</p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onResolve('cancel')}>
            {t('Common.cancel')}
          </Button>
          <Button variant="outline" onClick={() => onResolve('keep-both')}>
            {t('Common.keepBoth')}
          </Button>
          <Button variant="default" onClick={() => onResolve('overwrite')}>
            {t('Common.replace')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
