import GeneratedContractsList from '@/components/contract/generated/generated-contract-list'
import { useTranslation } from 'react-i18next'

function GeneratedContractsPage() {
  const { t } = useTranslation()

  return (
    <section className="@container/main flex flex-1 flex-col p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t('GeneratedContracts.title')}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          {t('GeneratedContracts.subtitle')}
        </p>
      </div>

      <GeneratedContractsList />
    </section>
  )
}

export default GeneratedContractsPage
