import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import type { ICreateContractTemplateDTO, IUpdateContractTemplateDTO } from '../../../../../types'
import useSettings from '@/hooks/use-settings'
import useContractTemplates from '@/hooks/use-contract-templates'
import { FileExistsDialog } from '@/components/helper/file-exists-dialog'
import { useAppStore } from '@/store'
import { useToast } from '@/hooks/useToast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { TEMPLATE_TYPES } from '@/constants/template'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  type: z.string().min(1, 'Type is required').trim(),
  filePath: z.string().min(1, 'File path is required').trim()
})

type FormValues = z.infer<typeof formSchema>

type ConflictType = 'file_import' | 'template_name'

export function ContractTemplateForm() {
  const { t } = useTranslation()
  const toast = useToast()
  const [pendingImport, setPendingImport] = useState<{
    sourcePath: string
    fileName: string
  } | null>(null)
  const [pendingTemplate, setPendingTemplate] = useState<FormValues | null>(null)
  const [conflictType, setConflictType] = useState<ConflictType | null>(null)
  const [conflictFileName, setConflictFileName] = useState<string>('')

  const setDialogOpen = useAppStore((store) => store.setDialogOpen)
  const setFilePath = useAppStore((store) => store.setFilePath)
  const setMode = useAppStore((store) => store.setMode)
  const initialFilePath: string = useAppStore((store) => store.filePath)
  const dialogOpen: boolean = useAppStore((store) => store.dialogOpen)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      type: '',
      filePath: initialFilePath || ''
    }
  })

  const {
    template,
    templates,
    templateLoading,
    createTemplate,
    updateTemplate,
    isMutating,
    checkFileNameExists
  } = useContractTemplates({ path: initialFilePath })

  const { settings } = useSettings()

  useEffect(() => {
    if (dialogOpen === false) {
      form.reset()
      setPendingImport(null)
      setPendingTemplate(null)
      setConflictType(null)
      setConflictFileName('')
      setFilePath('')
      setMode('new')
    }
  }, [dialogOpen, form, setMode, setFilePath])

  useEffect(() => {
    if (template && !templateLoading) {
      form.reset({
        title: template.title,
        type: template.type,
        filePath: template.file_path
      })
    }
  }, [template, form, templateLoading])

  const getTemplatesRoot = async (): Promise<string> => {
    if (!settings?.contract_templates_dir) {
      throw new Error('Templates directory not configured. Please set it in Settings.')
    }
    await window.fileManager.setRootPath(settings.contract_templates_dir)
    return settings.contract_templates_dir
  }

  const handleImportFile = async (
    sourcePath: string,
    options?: { overwrite?: boolean; keepBoth?: boolean }
  ): Promise<void> => {
    const templatesRoot = await getTemplatesRoot()
    const result = await window.fileManager.importFile(sourcePath, templatesRoot, options)

    if (result.conflict) {
      setPendingImport({ sourcePath, fileName: result.fileName })
      form.setValue('filePath', result.fileName, { shouldValidate: true })
    } else {
      form.setValue('filePath', result.fileName, { shouldValidate: true })
      setPendingImport(null)
    }
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

      const templatesRoot = await getTemplatesRoot()
      const normalizedRoot = templatesRoot.replace(/\\/g, '/').toLowerCase()
      const normalizedSelected = selectedPath.replace(/\\/g, '/').toLowerCase()
      const fileName = selectedPath.split(/[/\\]/).pop()!

      if (normalizedSelected.startsWith(normalizedRoot + '/')) {
        form.setValue('filePath', fileName, { shouldValidate: true })
      } else {
        await handleImportFile(selectedPath)
      }
    } catch (error) {
      if (!(error instanceof Error && error.message === 'FILE_EXISTS')) {
        toast.error(error instanceof Error ? error.message : t('Errors.failedToSelectFile'))
      }
    }
  }

  const handleSubmit = async (values: FormValues): Promise<void> => {
    try {
      const fileName = values.filePath.split(/[/\\]/).pop()

      if (pendingImport) {
        setPendingTemplate(values)
        setConflictType('file_import')
        setConflictFileName(fileName!)
        return
      }

      const isDuplicate = checkFileNameExists(fileName!, template?.id)

      if (isDuplicate) {
        setPendingTemplate(values)
        setConflictType('template_name')
        setConflictFileName(fileName!)
        return
      }

      // No conflict - proceed with save
      await saveTemplate(values)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Common.error'))
    }
  }

  const saveTemplate = async (values: FormValues): Promise<void> => {
    // Get the full absolute path
    const templatesRoot = await getTemplatesRoot()
    const fileName = values.filePath.split(/[/\\]/).pop()!
    const fullPath = `${templatesRoot}\\${fileName}`

    if (template) {
      // Update existing
      const updateData: IUpdateContractTemplateDTO = {}
      if (values.title !== template.title) updateData.title = values.title
      if (values.type !== template.type) updateData.type = values.type
      if (fullPath !== template.file_path) updateData.filePath = fullPath

      await updateTemplate({ id: template.id, data: updateData })
    } else {
      const data: ICreateContractTemplateDTO = {
        title: values.title,
        type: values.type,
        filePath: fullPath
      }
      await createTemplate(data)
    }
    setDialogOpen(false)
  }

  const handleConflictResolve = async (
    action: 'replace' | 'keep-both' | 'cancel'
  ): Promise<void> => {
    if (action === 'cancel') {
      setPendingImport(null)
      setPendingTemplate(null)
      setConflictType(null)
      setConflictFileName('')
      return
    }

    if (conflictType === 'file_import' && pendingImport && pendingTemplate) {
      try {
        if (action === 'replace') {
          await handleImportFile(pendingImport.sourcePath, { overwrite: true })

          const existingTemplate = templates.find((t) => t.file_path === pendingTemplate.filePath)

          if (existingTemplate) {
            await updateTemplate({
              id: existingTemplate.id,
              data: {
                title: pendingTemplate.title,
                type: pendingTemplate.type,
                filePath: pendingTemplate.filePath
              }
            })
          } else {
            await createTemplate({
              title: pendingTemplate.title,
              type: pendingTemplate.type,
              filePath: pendingTemplate.filePath
            })
          }
          setDialogOpen(false)
        } else if (action === 'keep-both') {
          await handleImportFile(pendingImport.sourcePath, { keepBoth: true })
          const newFileName = form.getValues('filePath')
          await createTemplate({
            title: pendingTemplate.title,
            type: pendingTemplate.type,
            filePath: newFileName
          })
          setDialogOpen(false)
        }

        setPendingImport(null)
        setPendingTemplate(null)
        setConflictType(null)
        setConflictFileName('')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('Errors.failedToImportFile'))
        setPendingImport(null)
        setPendingTemplate(null)
        setConflictType(null)
        setConflictFileName('')
      }
    } else if (conflictType === 'template_name' && pendingTemplate) {
      try {
        if (action === 'replace') {
          // Find and update the existing template
          const existingTemplate = templates.find((t) => t.file_path === pendingTemplate.filePath)

          if (existingTemplate) {
            await updateTemplate({
              id: existingTemplate.id,
              data: {
                title: pendingTemplate.title,
                type: pendingTemplate.type,
                filePath: pendingTemplate.filePath
              }
            })
          }
          setDialogOpen(false)
        } else if (action === 'keep-both') {
          // Copy the physical file in the root directory
          const templatesRoot = await getTemplatesRoot()

          const sourceAbsPath = `${templatesRoot}\\${pendingTemplate.filePath}`

          // Copy the file - returns new filename with " - Copy" suffix
          const newFileName = await window.fileManager.copy([sourceAbsPath], templatesRoot, {
            keepBoth: true
          })

          // Create new template record with the copied file
          await createTemplate({
            title: pendingTemplate.title,
            type: pendingTemplate.type,
            filePath: newFileName
          })

          form.setValue('filePath', newFileName)
        }

        setPendingTemplate(null)
        setConflictType(null)
        setConflictFileName('')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('Common.error'))
        setPendingTemplate(null)
        setConflictType(null)
        setConflictFileName('')
      }
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
                <FormLabel>{t('ContractTemplates.templateTitle')}</FormLabel>
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
                <FormLabel>{t('ContractTemplates.templateType')}</FormLabel>
                <Select
                  onValueChange={(value) => {
                    if (template && !value) return
                    field.onChange(value)
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('ContractTemplates.selectType')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {t(`ContractTemplates.types.${type.value}`, type.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              onClick={() => setDialogOpen(false)}
              disabled={isMutating}
            >
              {t('Common.cancel')}
            </Button>
            <Button type="submit" disabled={isMutating}>
              {isMutating ? t('Common.saving') : template ? t('Common.update') : t('Common.create')}
            </Button>
          </div>
        </form>
      </Form>

      <FileExistsDialog
        fileName={conflictFileName}
        type={conflictType || 'file_import'}
        open={!!conflictType && (!!pendingImport || !!pendingTemplate)}
        onResolve={handleConflictResolve}
      />
    </>
  )
}
