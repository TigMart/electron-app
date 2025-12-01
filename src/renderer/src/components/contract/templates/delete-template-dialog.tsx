import { useTranslation } from 'react-i18next'
import type { IContractTemplate } from '@/types'
import DeleteDialog from '@/components/common/delete-dialog'

interface DeleteTemplateDialogProps {
  template: IContractTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting?: boolean
}

export function DeleteTemplateDialog({
  template,
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false
}: DeleteTemplateDialogProps) {
  const { t } = useTranslation()

  if (!template) return null

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleConfirm}
      title={t('DeleteDialog.title', { name: template.title })}
      description={t('DeleteDialog.message')}
      isDeleting={isDeleting}
    />
  )
}
