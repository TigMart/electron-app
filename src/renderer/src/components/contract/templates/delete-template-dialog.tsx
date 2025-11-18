import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import type { IContractTemplate } from '../../../../../backend/types'
import { AlertTriangle } from 'lucide-react'

interface DeleteTemplateDialogProps {
  template: IContractTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteTemplateDialog({
  template,
  open,
  onOpenChange,
  onConfirm
}: DeleteTemplateDialogProps) {
  const { t } = useTranslation()

  if (!template) return null

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-destructive/10 rounded-full p-2">
              <AlertTriangle className="text-destructive h-5 w-5" />
            </div>
            <DialogTitle>{t('DeleteDialog.title', { name: template.title })}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{t('DeleteDialog.message')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Common.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            {t('Common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
