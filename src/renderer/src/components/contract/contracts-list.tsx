import ShowError from '@/components/helper/show-error'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { FileText, MoreVertical, Pencil, Trash2, Calendar } from 'lucide-react'
import useContracts from '@/hooks/use-contracts'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/utils/format'
import type { IContract } from '@/types'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { useState } from 'react'
import DeleteContractDialog from './delete-contract-dialog'

function ContractsList() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { contracts, contractsLoading, contractsError } = useContracts()
  const { openCreateDialog, openEditDialog } = useAppStore()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<IContract | null>(null)

  const handleClick = (contract: IContract) => {
    navigate(`/contracts/${contract.id}`)
  }

  const handleEdit = (contract: IContract, e: React.MouseEvent) => {
    e.stopPropagation()
    openEditDialog(contract)
  }

  const handleDeleteClick = (contract: IContract, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedContract(contract)
    setDeleteDialogOpen(true)
  }

  if (contractsLoading) {
    return (
      <div className="mt-4 grid gap-2 md:mt-6 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-1 h-3 w-1/2" />
            <Skeleton className="mt-1.5 h-3 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  if (contractsError) {
    return (
      <div className="mt-4 md:mt-6">
        <ShowError message={contractsError?.message ?? t('Errors.failedToLoad')} />
      </div>
    )
  }

  if (!contracts || contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-semibold">{t('Contracts.noContracts')}</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {t('Contracts.noContractsDescription')}
        </p>
        <Button onClick={openCreateDialog}>{t('Contracts.createContract')}</Button>
      </div>
    )
  }

  return (
    <div className="mt-4 grid gap-2 md:mt-6 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {contracts.map((contract) => (
        <Card
          key={contract.id}
          className="min-w-0 cursor-pointer gap-2 overflow-hidden p-2 transition-shadow hover:shadow-md"
          onClick={() => handleClick(contract)}
        >
          <CardHeader className="p-2 pb-1">
            <div className="flex items-start justify-between gap-1.5">
              <div className="flex min-w-0 flex-1 items-start gap-1.5">
                <div className="bg-primary/10 shrink-0 rounded p-1">
                  <FileText className="text-primary h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-sm leading-tight" title={contract.title}>
                    {contract.title}
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    {contract.template_title && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                        {contract.template_title}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="-mr-1 h-6 w-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => handleEdit(contract, e)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    {t('Common.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => handleDeleteClick(contract, e)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    {t('Common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-1">
            <div className="space-y-0.5 text-xs">
              {contract.template_type && (
                <div className="text-muted-foreground flex min-w-0 items-center">
                  <FileText className="mr-1 h-3 w-3 shrink-0" />
                  <span className="min-w-0 flex-1 truncate" title={contract.template_type}>
                    {contract.template_type}
                  </span>
                </div>
              )}
              <div className="text-muted-foreground flex items-center">
                <Calendar className="mr-1 h-3 w-3 shrink-0" />
                <span>{formatDate(contract.updated_at, i18n.language)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <DeleteContractDialog
        contract={selectedContract}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  )
}

export default ContractsList
