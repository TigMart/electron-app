import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import type {
  IContractTemplate,
  ICreateContractTemplateDTO,
  IUpdateContractTemplateDTO
} from '../../../../backend/types'

interface ContractTemplateFormProps {
  template?: IContractTemplate
  initialFilePath?: string | null
  currentDirectory?: string | null
  onSuccess: () => void
  onCancel: () => void
}

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  type: z.string().min(1, 'Type is required').trim(),
  filePath: z.string().min(1, 'File path is required').trim()
})

type FormValues = z.infer<typeof formSchema>

export function ContractTemplateForm({
  template,
  initialFilePath,
  currentDirectory,
  onSuccess,
  onCancel
}: ContractTemplateFormProps) {
  const { t } = useTranslation()
  const [pendingImport, setPendingImport] = useState<{
    sourcePath: string
    targetDirectory: string
    templatesRoot: string
  } | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      type: '',
      filePath: initialFilePath || ''
    }
  })

  // Load template data from DB on edit
  useEffect(() => {
    async function loadTemplateData() {
      if (initialFilePath && !template) {
        // If we have initialFilePath but no template, fetch from DB
        try {
          const { getTemplateByFilePath } = await import('../../services/contract-template.service')
          const existingTemplate = await getTemplateByFilePath(initialFilePath)

          if (existingTemplate) {
            form.reset({
              title: existingTemplate.title,
              type: existingTemplate.type,
              filePath: existingTemplate.file_path
            })
          }
        } catch (error) {
          console.error('Failed to load template data:', error)
        }
      } else if (template) {
        // If template is provided directly, use it
        form.reset({
          title: template.title,
          type: template.type,
          filePath: template.file_path
        })
      }
    }

    loadTemplateData()
  }, [initialFilePath, template, form])

  // Get templates root directory
  const getTemplatesRoot = async (): Promise<string> => {
    const { getSettings } = await import('../../services/settings.service')
    const settings = await getSettings()
    if (!settings.contract_templates_dir) {
      throw new Error('Templates directory not configured. Please set it in Settings.')
    }
    return settings.contract_templates_dir
  }

  const handleImportFile = async (
    sourcePath: string,
    targetDirectory: string,
    templatesRoot: string,
    options?: { overwrite?: boolean; keepBoth?: boolean }
  ): Promise<void> => {
    const normalizedRoot = templatesRoot.replace(/\\/g, '/').toLowerCase()
    const normalizedTarget = targetDirectory.replace(/\\/g, '/').toLowerCase()

    const relativePath = await window.fileManager.importFile(sourcePath, targetDirectory, options)

    // Calculate relative path from templates root
    const fullPath = normalizedTarget + '/' + relativePath
    const finalRelativePath = fullPath.substring(normalizedRoot.length).replace(/^[/\\]/, '')

    form.setValue('filePath', finalRelativePath, { shouldValidate: true })
    setPendingImport(null)
    toast.success('File copied to templates directory')
  }

  const handleSelectFile = async (): Promise<void> => {
    try {
      const selectedPath = await window.fileManager.selectFile({
        filters: [
          { name: 'Word Documents', extensions: ['docx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      if (!selectedPath) return

      // Get templates root and current directory
      const templatesRoot = await getTemplatesRoot()
      const targetDirectory = currentDirectory || templatesRoot

      const normalizedRoot = templatesRoot.replace(/\\/g, '/').toLowerCase()
      const normalizedSelected = selectedPath.replace(/\\/g, '/').toLowerCase()

      // Check if file is already in templates directory
      if (normalizedSelected.startsWith(normalizedRoot + '/')) {
        // File is in templates directory - store relative path
        const relativePath = selectedPath.substring(templatesRoot.length).replace(/^[/\\]/, '')
        form.setValue('filePath', relativePath, { shouldValidate: true })
      } else {
        // File is outside templates directory - import it to current directory
        try {
          await handleImportFile(selectedPath, targetDirectory, templatesRoot)
        } catch (error) {
          if (error instanceof Error && error.message === 'FILE_EXISTS') {
            // File exists, show confirmation dialog
            setPendingImport({ sourcePath: selectedPath, targetDirectory, templatesRoot })
          } else {
            throw error
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to select file')
    }
  }

  const handleSubmit = async (values: FormValues): Promise<void> => {
    try {
      if (template) {
        // Update existing template
        const updateData: IUpdateContractTemplateDTO = {}
        if (values.title !== template.title) updateData.title = values.title
        if (values.type !== template.type) updateData.type = values.type
        if (values.filePath !== template.file_path) updateData.filePath = values.filePath

        // Import dynamically to avoid circular dependencies
        const { updateTemplate } = await import('../../services/contract-template.service')
        await updateTemplate(template.id, updateData)
        toast.success(t('ContractTemplates.templateUpdated'))
      } else {
        // If we're editing via file path, first check if template exists
        let templateId: number | undefined

        if (initialFilePath) {
          const { getTemplateByFilePath } = await import('../../services/contract-template.service')
          const existingTemplate = await getTemplateByFilePath(initialFilePath)
          templateId = existingTemplate?.id
        }

        if (templateId) {
          // Update existing template
          const updateData: IUpdateContractTemplateDTO = {
            title: values.title,
            type: values.type,
            filePath: values.filePath
          }
          const { updateTemplate } = await import('../../services/contract-template.service')
          await updateTemplate(templateId, updateData)
          toast.success(t('ContractTemplates.templateUpdated'))
        } else {
          // Create new template
          const data: ICreateContractTemplateDTO = {
            title: values.title,
            type: values.type,
            filePath: values.filePath
          }
          const { createTemplate } = await import('../../services/contract-template.service')
          await createTemplate(data)
          toast.success(t('ContractTemplates.templateCreated'))
        }
      }

      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Common.error'))
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ContractTemplates.title')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('ContractTemplates.titlePlaceholder')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Common.type')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('ContractTemplates.typePlaceholder')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="filePath"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ContractTemplates.filePath')}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input {...field} placeholder={t('ContractTemplates.selectTemplateFile')} />
                  </FormControl>
                  <Button type="button" variant="outline" onClick={handleSelectFile}>
                    {t('Common.browse')}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={form.formState.isSubmitting}
            >
              {t('Common.cancel')}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? t('Common.saving')
                : template
                  ? t('Common.update')
                  : t('Common.create')}
            </Button>
          </div>
        </form>
      </Form>

      {/* File Conflict Dialog */}
      {pendingImport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">
              {t('ContractTemplates.fileAlreadyExists')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('ContractTemplates.fileExistsMessage')}
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={async () => {
                  try {
                    await handleImportFile(
                      pendingImport.sourcePath,
                      pendingImport.targetDirectory,
                      pendingImport.templatesRoot,
                      { overwrite: true }
                    )
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Failed to import file')
                    setPendingImport(null)
                  }
                }}
              >
                {t('Common.replace')}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await handleImportFile(
                      pendingImport.sourcePath,
                      pendingImport.targetDirectory,
                      pendingImport.templatesRoot,
                      { keepBoth: true }
                    )
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Failed to import file')
                    setPendingImport(null)
                  }
                }}
              >
                {t('Common.keepBoth')}
              </Button>
              <Button variant="ghost" onClick={() => setPendingImport(null)}>
                {t('Common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
