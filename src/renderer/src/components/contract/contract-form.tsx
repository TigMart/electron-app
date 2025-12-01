import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import useContracts from '@/hooks/use-contracts'
import useContractTemplates from '@/hooks/use-contract-templates'
import type { IContract } from '@/types'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { logger } from '@/utils/logger'

const contractSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  templateId: z.number().int().positive('Please select a template')
})

type ContractFormValues = z.infer<typeof contractSchema>

interface ContractFormProps {
  contract?: IContract | null
  onSuccess?: () => void
  onCancel?: () => void
}

function ContractForm({ contract, onSuccess, onCancel }: ContractFormProps) {
  const { t } = useTranslation()
  const { createContract, updateContract, isCreating, isUpdating } = useContracts()
  const { templates, templatesLoading } = useContractTemplates()

  const isEditMode = !!contract
  const isLoading = isCreating || isUpdating

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      title: contract?.title || '',
      templateId: contract?.template_id
    }
  })

  // Reset form when contract changes
  useEffect(() => {
    form.reset({
      title: contract?.title || '',
      templateId: contract?.template_id
    })
  }, [contract, form])

  const onSubmit = async (data: ContractFormValues) => {
    try {
      if (isEditMode && contract) {
        await updateContract({
          id: contract.id,
          data: {
            title: data.title,
            templateId: data.templateId
          }
        })
      } else {
        await createContract({
          title: data.title,
          templateId: data.templateId
        })
      }
      onSuccess?.()
      form.reset()
    } catch (error) {
      // Error handling is done in the mutation
      logger.error(`Faild ${error}`)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Contracts.contractTitle')}</FormLabel>
              <FormControl>
                <Input placeholder={t('Contracts.enterTitle')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="templateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Contracts.selectTemplate')}</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value?.toString()}
                disabled={templatesLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Contracts.chooseTemplate')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.title} ({template.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('Common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? t('Common.saving') : t('Common.creating')}
              </>
            ) : (
              t(isEditMode ? 'Common.save' : 'Contracts.createContract')
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default ContractForm
