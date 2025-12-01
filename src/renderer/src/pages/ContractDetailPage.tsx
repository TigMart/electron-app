import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROUTES } from '@/constants/routes'
import useContracts from '@/hooks/use-contracts'
import { Loader2, Download, FolderOpen, ArrowLeft, FileText, Sparkles } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/utils/format'
import Loading from '@/components/common/loading'
import ShowError from '@/components/helper/show-error'
import { useToast } from '@/hooks/useToast'
import { Textarea } from '@/components/ui/textarea'

function ContractDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { contract, contractLoading, contractError } = useContracts({ id: Number(id) })

  const [jsonData, setJsonData] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedFilePath, setGeneratedFilePath] = useState<string | null>(null)
  const [generatedFileName, setGeneratedFileName] = useState<string | null>(null)

  const handleBack = () => {
    navigate(ROUTES.CONTRACTS)
  }

  const handleGenerate = async () => {
    if (!jsonData.trim()) {
      toast.error('Please enter JSON data')
      return
    }

    // Validate JSON
    try {
      JSON.parse(jsonData)
    } catch {
      toast.error('Invalid JSON format. Please check your input.')
      return
    }

    setIsGenerating(true)
    setGeneratedFilePath(null)
    setGeneratedFileName(null)

    try {
      const result = await window.electron.ipcRenderer.invoke('generate-contract', {
        contractId: Number(id),
        jsonData: jsonData
      })
      setGeneratedFilePath(result.filePath)
      setGeneratedFileName(result.fileName)
      toast.success('Contract generated successfully!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate contract'
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOpenFile = async () => {
    if (generatedFilePath) {
      try {
        await window.electron.ipcRenderer.invoke('open-file', generatedFilePath)
      } catch {
        toast.error('Failed to open file')
      }
    }
  }

  const handleShowInFolder = async () => {
    if (generatedFilePath) {
      try {
        await window.electron.ipcRenderer.invoke('show-file-in-folder', generatedFilePath)
      } catch {
        toast.error('Failed to show file in folder')
      }
    }
  }

  if (contractLoading) {
    return (
      <section className="@container/main flex flex-1 flex-col p-4 md:p-6">
        <Loading />
      </section>
    )
  }

  if (contractError || !contract) {
    return (
      <section className="@container/main flex h-full flex-1 flex-col p-4 md:p-6">
        <ShowError message={contractError?.message ?? t('Errors.failedToLoad')} />
      </section>
    )
  }

  return (
    <section className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{contract.title}</h1>
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Contract Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('Contracts.contractDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <dt className="text-muted-foreground text-sm font-medium">{t('Common.title')}</dt>
              <dd className="text-base">{contract.title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                {t('Contracts.template')}
              </dt>
              <dd className="text-base">{contract.template_title || 'N/A'}</dd>
            </div>
            {contract.template_type && (
              <div>
                <dt className="text-muted-foreground text-sm font-medium">{t('Common.type')}</dt>
                <dd className="text-base">{contract.template_type}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground text-sm font-medium">{t('Common.createdAt')}</dt>
              <dd className="text-sm">{formatDate(contract.created_at, i18n.language)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">{t('Common.updatedAt')}</dt>
              <dd className="text-sm">{formatDate(contract.updated_at, i18n.language)}</dd>
            </div>
          </CardContent>
        </Card>

        {/* Contract Generation Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Contract
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Provide JSON data to fill the template placeholders (e.g., {`{clientName}`})
            </p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="flex-1">
              <Textarea
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder='{\n  "clientName": "John Doe",\n  "startDate": "2025-01-01"\n}'
                className="h-full min-h-[300px] resize-none font-mono text-xs"
              />
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Contract
                </>
              )}
            </Button>

            {generatedFilePath && (
              <div className="bg-muted rounded-lg border p-4">
                <p className="mb-2 text-sm font-medium text-green-600">✓ Contract Generated!</p>
                <p className="text-muted-foreground mb-3 text-xs">{generatedFileName}</p>
                <div className="flex gap-2">
                  <Button onClick={handleOpenFile} variant="outline" size="sm" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Open File
                  </Button>
                  <Button
                    onClick={handleShowInFolder}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Show in Folder
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default ContractDetailPage
