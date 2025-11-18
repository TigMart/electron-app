import Loading from '@/components/common/loading'
import Header from '@/components/contract/templates/header'
import TemplatesList from '@/components/contract/templates/templates-list'
import ShowError from '@/components/helper/show-error'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import useSettings from '@/hooks/use-settings'
import { IconFolderOpen } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

function ContractTemplatesPage2() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [rootPath, setRootPath] = useState<string | null>(null)

  const goToSettings = () => {
    navigate(ROUTES.SETTINGS)
  }
  const { settings, isLoading, error } = useSettings()

  useEffect(() => {
    setRootPath(settings?.contract_templates_dir ?? null)
  }, [settings])

  if (isLoading) {
    return (
      <section className="@container/main flex flex-1 flex-col p-4 md:p-6 ">
        <Loading />
      </section>
    )
  }
  if (error) {
    return (
      <section className="@container/main flex flex-1 flex-col p-4 md:p-6 h-full">
        <ShowError message={error?.message ?? 'Failed to load settings'} />
      </section>
    )
  }

  if (!rootPath) {
    return (
      <section className="@container/main flex flex-1 flex-col p-4 md:p-6">
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <IconFolderOpen size={64} className="text-muted-foreground" />
          <h2 className="text-2xl font-semibold">{t('ContractTemplates.noRootDirectory')}</h2>
          <p className="text-muted-foreground">{t('ContractTemplates.configureInSettings')}</p>
          <Button onClick={goToSettings}>
            <IconFolderOpen className="mr-2" size={16} />
            {t('Navigation.Settings')}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="@container/main flex flex-1 flex-col p-4 md:p-6">
      <Header />
      <TemplatesList />
    </section>
  )
}

export default ContractTemplatesPage2
