import { useState } from 'react'
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
import useContractTemplates from '@/hooks/use-contract-templates'
import useSettings from '@/hooks/use-settings'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/utils/format'
import { DeleteTemplateDialog } from '@/components/contract/templates/delete-template-dialog'
import type { IContractTemplate } from '../../../../../backend/types'
import { useAppStore } from '@/store'

function TemplatesList() {
  const { t, i18n } = useTranslation()
  const { templates, templatesLoading, templatesError, deleteTemplate } = useContractTemplates()
  const { settings } = useSettings()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<IContractTemplate | null>(null)

  const setFilePath = useAppStore((store) => store.setFilePath)
  const setDialogOpen = useAppStore((store) => store.setDialogOpen)
  const setMode = useAppStore((store) => store.setMode)

  const handleDoubleClick = async (template: IContractTemplate) => {
    if (!settings?.contract_templates_dir) {
      console.error('Templates directory not configured')
      return
    }
    const fullPath = `${settings.contract_templates_dir}\\${template.file_path}`
    await window.fileManager.openFile(fullPath)
  }

  const handleEdit = (template: IContractTemplate) => {
    setFilePath(template.file_path)
    setMode('edit')
    setDialogOpen(true)
  }

  const handleDeleteClick = (template: IContractTemplate) => {
    setTemplateToDelete(template)
    setDeleteDialogOpen(true)
  }

  const handleNewTemplate = () => {
    setMode('new')
    setDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (templateToDelete) {
      await deleteTemplate(templateToDelete.id)
      await window.fileManager.remove(
        [`${settings?.contract_templates_dir}\\${templateToDelete.file_path}`],
        { toTrash: true }
      )
      setTemplateToDelete(null)
    }
  }

  if (templatesLoading) {
    return (
      <div className="grid gap-2 md:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4 md:mt-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2 mt-1" />
            <Skeleton className="h-3 w-full mt-1.5" />
          </Card>
        ))}
      </div>
    )
  }

  if (templatesError) {
    return (
      <div className="mt-4 md:mt-6">
        <ShowError message={templatesError?.message ?? t('Errors.failedToLoad')} />
      </div>
    )
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('ContractTemplates.noTemplates')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('ContractTemplates.noTemplatesDescription')}
        </p>
        <Button onClick={handleNewTemplate}>{t('ContractTemplates.newTemplate')}</Button>
      </div>
    )
  }

  return (
    <div className="grid gap-2 md:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4 md:mt-6">
      {templates.map((template) => (
        <Card
          key={template.id}
          className="hover:shadow-md transition-shadow cursor-pointer p-2 gap-2 min-w-0 overflow-hidden"
          onDoubleClick={() => handleDoubleClick(template)}
        >
          <CardHeader className="p-2 pb-1">
            <div className="flex items-start justify-between gap-1.5">
              <div className="flex items-start gap-1.5 flex-1 min-w-0">
                <div className="rounded bg-primary/10 p-1 shrink-0">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm truncate leading-tight" title={template.title}>
                    {template.title}
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                      {template.type}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mr-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(template)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    {t('Common.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(template)}
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
              <div className="flex items-center text-muted-foreground min-w-0">
                <FileText className="mr-1 h-3 w-3 shrink-0" />
                <span className="truncate min-w-0 flex-1" title={template.file_path}>
                  {template.file_path}
                </span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Calendar className="mr-1 h-3 w-3 shrink-0" />
                <span>{formatDate(template.updated_at, i18n.language)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <DeleteTemplateDialog
        template={templateToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

export default TemplatesList
