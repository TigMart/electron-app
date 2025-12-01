import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import ContractForm from './contract-form'

function ContractFormDialog() {
  const { t } = useTranslation()
  const { isOpen, selectedContract, closeDialog } = useAppStore()

  const isEditMode = !!selectedContract

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t('Contracts.updateContract') : t('Contracts.createContract')}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? t('Contracts.updateDescription') : t('Contracts.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <ContractForm contract={selectedContract} onSuccess={closeDialog} onCancel={closeDialog} />
      </DialogContent>
    </Dialog>
  )
}

export default ContractFormDialog
