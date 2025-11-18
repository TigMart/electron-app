import { useState, useEffect } from 'react'
import { FolderOpen, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getSettings, updateSettings } from '@/services/settings.service'
import { useToast } from '@/hooks/useToast'

export default function SettingsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [contractTemplatesDir, setContractTemplatesDir] = useState<string>('')
  const [generatedContractsDir, setGeneratedContractsDir] = useState<string>('')

  useEffect(() => {
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadSettings = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const data = await getSettings()
      setContractTemplatesDir(data.contract_templates_dir || '')
      setGeneratedContractsDir(data.generated_contracts_dir || '')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectTemplatesDir = async (): Promise<void> => {
    try {
      const selectedPath = await window.fileManager.selectFolder()
      if (selectedPath) {
        setContractTemplatesDir(selectedPath)
      }
    } catch {
      toast.error('Failed to select folder')
    }
  }

  const handleSelectGeneratedDir = async (): Promise<void> => {
    try {
      const selectedPath = await window.fileManager.selectFolder()
      if (selectedPath) {
        setGeneratedContractsDir(selectedPath)
      }
    } catch {
      toast.error('Failed to select folder')
    }
  }

  const handleSave = async (): Promise<void> => {
    try {
      setIsSaving(true)
      await updateSettings({
        contractTemplatesDir: contractTemplatesDir || null,
        generatedContractsDir: generatedContractsDir || null
      })
      console.log('aaa')
      toast.success('Settings saved successfully')
      await loadSettings()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="text-muted-foreground py-12 text-center">{t('Common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div>
        <h1 className="text-3xl font-bold">{t('Settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('Settings.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Settings.directorySettings')}</CardTitle>
          <CardDescription>{t('Settings.directorySettingsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="templatesDir">{t('Settings.contractTemplatesDir')}</Label>
            <div className="flex gap-2">
              <Input
                id="templatesDir"
                value={contractTemplatesDir}
                onChange={(e) => setContractTemplatesDir(e.target.value)}
                placeholder={t('Settings.selectTemplatesDir')}
              />
              <Button type="button" variant="outline" onClick={handleSelectTemplatesDir}>
                <FolderOpen className="mr-2 h-4 w-4" />
                {t('Common.browse')}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">{t('Settings.templatesDirHelp')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="generatedDir">{t('Settings.generatedContractsDir')}</Label>
            <div className="flex gap-2">
              <Input
                id="generatedDir"
                value={generatedContractsDir}
                onChange={(e) => setGeneratedContractsDir(e.target.value)}
                placeholder={t('Settings.selectGeneratedDir')}
              />
              <Button type="button" variant="outline" onClick={handleSelectGeneratedDir}>
                <FolderOpen className="mr-2 h-4 w-4" />
                {t('Common.browse')}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">{t('Settings.generatedDirHelp')}</p>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? t('Settings.saving') : t('Settings.saveSettings')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
