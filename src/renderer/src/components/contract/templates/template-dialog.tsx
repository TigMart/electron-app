import { ContractTemplateForm } from '@/components/contract/templates/template-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { useAppStore } from '@/store'
import { useTranslation } from 'react-i18next'

function ContractTemplateDialog() {
  const { t } = useTranslation()
  const setDialogOpen = useAppStore((store) => store.setDialogOpen)
  const dialogOpen = useAppStore((store) => store.dialogOpen)
  const mode = useAppStore((store) => store.mode)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          {t('ContractTemplates.newTemplate')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? t('ContractTemplates.editInfo') : t('ContractTemplates.newTemplate')}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <ContractTemplateForm />
      </DialogContent>
    </Dialog>
  )
}

export default ContractTemplateDialog
