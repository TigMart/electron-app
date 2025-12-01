import ContractFormDialog from '@/components/contract/contract-dialog'
import ContractsList from '@/components/contract/contracts-list'
import ContractHeader from '@/components/contract/contract-header'

function ContractsPage() {
  return (
    <section className="@container/main flex flex-1 flex-col p-4 md:p-6">
      <ContractHeader />
      <ContractsList />
      <ContractFormDialog />
    </section>
  )
}

export default ContractsPage
