import { useTranslation } from 'react-i18next'
import useContracts from '@/hooks/use-contracts'
import type { IContract } from '@/types'
import DeleteDialog from '@/components/common/delete-dialog'

interface DeleteContractDialogProps {
  contract: IContract | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DeleteContractDialog({ contract, open, onOpenChange }: DeleteContractDialogProps) {
  const { t } = useTranslation()
  const { deleteContract, isDeleting } = useContracts()

  const handleDelete = async () => {
    if (!contract) return
    await deleteContract(contract.id)
    onOpenChange(false)
  }

  if (!contract) return null

  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleDelete}
      title={t('Contracts.deleteContract')}
      description={t('Contracts.deleteDescription', { title: contract.title })}
      isDeleting={isDeleting}
    />
  )
}

export default DeleteContractDialog
