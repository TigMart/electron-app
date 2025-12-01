import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useTranslation } from 'react-i18next'

interface DeleteGeneratedContractDialogProps {
  fileName: string
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteGeneratedContractDialog({
  fileName,
  open,
  onConfirm,
  onCancel
}: DeleteGeneratedContractDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('GeneratedContracts.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('GeneratedContracts.deleteMessage', { fileName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t('Common.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t('Common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
