import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { FileText, MoreVertical, Trash2, FolderOpen, Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/utils/format'
import { DeleteGeneratedContractDialog } from './delete-generated-contract-dialog'
import useSettings from '@/hooks/use-settings'
import { useToast } from '@/hooks/useToast'

interface GeneratedContract {
  name: string
  path: string
  size: number
  createdAt: Date
}

function GeneratedContractsList() {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const { settings } = useSettings()
  const [contracts, setContracts] = useState<GeneratedContract[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contractToDelete, setContractToDelete] = useState<GeneratedContract | null>(null)

  const loadContracts = async () => {
    if (!settings?.generated_contracts_dir) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Use the specific API for generated contracts to bypass file manager root restrictions
      const files = await window.database.contracts.listGenerated(settings.generated_contracts_dir)

      const contractFiles: GeneratedContract[] = files.map(
        (file: {
          name: string
          path: string
          size: number
          modified: number
          created: number
        }) => ({
          name: file.name,
          path: file.path,
          size: file.size,
          createdAt: new Date(file.modified || file.created || Date.now())
        })
      )

      // Sort by creation date, newest first
      contractFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      setContracts(contractFiles)
    } catch (error) {
      console.error('Failed to load generated contracts:', error)
      toast.error(t('GeneratedContracts.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContracts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.generated_contracts_dir])

  const handleDoubleClick = async (contract: GeneratedContract) => {
    try {
      await window.database.contracts.openFile(contract.path)
    } catch {
      toast.error(t('GeneratedContracts.failedToOpen'))
    }
  }

  const handleOpen = async (contract: GeneratedContract) => {
    try {
      await window.database.contracts.openFile(contract.path)
    } catch {
      toast.error(t('GeneratedContracts.failedToOpen'))
    }
  }

  const handleRevealInFileExplorer = async (contract: GeneratedContract) => {
    try {
      await window.database.contracts.revealInExplorer(contract.path)
    } catch {
      toast.error(t('GeneratedContracts.failedToReveal'))
    }
  }

  const handleDeleteClick = (contract: GeneratedContract) => {
    setContractToDelete(contract)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (contractToDelete) {
      try {
        await window.database.contracts.deleteGenerated(contractToDelete.path)
        toast.success(t('GeneratedContracts.deleteSuccess'))
        await loadContracts() // Reload the list
      } catch {
        toast.error(t('GeneratedContracts.deleteFailed'))
      } finally {
        setContractToDelete(null)
        setDeleteDialogOpen(false)
      }
    }
  }

  const handleRefresh = () => {
    loadContracts()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
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

  if (!settings?.generated_contracts_dir) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <FileText className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-semibold">{t('GeneratedContracts.notConfigured')}</h3>
        <p className="text-muted-foreground text-sm">
          {t('GeneratedContracts.notConfiguredMessage')}
        </p>
      </div>
    )
  }

  if (contracts.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <FileText className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-semibold">{t('GeneratedContracts.noContracts')}</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {t('GeneratedContracts.noContractsMessage')}
        </p>
        <Button onClick={handleRefresh} variant="outline">
          {t('Common.refresh')}
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {t('GeneratedContracts.totalContracts', { count: contracts.length })}
        </p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          {t('Common.refresh')}
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {contracts.map((contract) => (
          <Card
            key={contract.path}
            className="group cursor-pointer transition-shadow hover:shadow-md"
            onDoubleClick={() => handleDoubleClick(contract)}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-start gap-2">
                <FileText className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="flex-1">
                  <CardTitle className="line-clamp-2 text-sm font-semibold">
                    {contract.name}
                  </CardTitle>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpen(contract)}>
                    <FileText className="mr-2 h-4 w-4" />
                    {t('Common.open')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRevealInFileExplorer(contract)}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    {t('Common.revealInFileExplorer')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(contract)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('Common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <CardDescription className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {formatDate(contract.createdAt.toISOString(), i18n.language)}
              </CardDescription>
              <CardDescription className="mt-1 text-xs">
                {formatFileSize(contract.size)}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <DeleteGeneratedContractDialog
        fileName={contractToDelete?.name || ''}
        open={deleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setContractToDelete(null)
          setDeleteDialogOpen(false)
        }}
      />
    </>
  )
}

export default GeneratedContractsList
