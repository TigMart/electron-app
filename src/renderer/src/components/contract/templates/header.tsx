import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ContarctTemplateDialog from '@/components/contract/templates/template-dialog'

function Header() {
  const { t } = useTranslation()

  return (
    <header className="w-full p-2 flex items-center justify-between border-b">
      <h1 className="text-2xl font-bold">{t('ContractTemplates.title')}</h1>
      <div id="actions" className="flex items-center space-x-2">
        <ContarctTemplateDialog />
        <Button variant="secondary" size="sm">
          <RefreshCcw />
        </Button>
      </div>
    </header>
  )
}

export default Header
