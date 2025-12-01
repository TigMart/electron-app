import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'
import { RefreshCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function ContractHeader() {
  const { t } = useTranslation()
  const openCreateDialog = useAppStore((state) => state.openCreateDialog)

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <header className="flex w-full items-center justify-between border-b p-2">
      <h1 className="text-2xl font-bold">{t('Contracts.title')}</h1>
      <div id="actions" className="flex items-center space-x-2">
        <Button onClick={openCreateDialog}>{t('Contracts.createContract')}</Button>
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
          <RefreshCcw />
        </Button>
      </div>
    </header>
  )
}

export default ContractHeader
