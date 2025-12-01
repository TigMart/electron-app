import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ContractTemplateDialog from '@/components/contract/templates/template-dialog'
import { useAppStore } from '@/store'
import ContractFormDialog from '@/components/contract/contract-dialog'

function Header() {
  const { t } = useTranslation()
  const hanldeRefresh = () => {
    window.location.reload()
  }
  const openCreateDialog = useAppStore((state) => state.openCreateDialog)

  return (
    <header className="flex w-full items-center justify-between border-b p-2">
      <h1 className="text-2xl font-bold">{t('ContractTemplates.title')}</h1>
      <div id="actions" className="flex items-center space-x-2">
        <ContractTemplateDialog />
        <ContractFormDialog />
        <Button onClick={openCreateDialog} size="sm">
          {t('Contracts.createContract')}
        </Button>
        <Button variant="secondary" size="sm" onClick={hanldeRefresh}>
          <RefreshCcw />
        </Button>
      </div>
    </header>
  )
}

export default Header
