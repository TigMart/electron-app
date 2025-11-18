import { QUERY_KEYS } from '@/constants/query-keys'
import {
  getAllTemplates,
  getTemplateByFilePath,
  createTemplate,
  updateTemplate,
  deleteTemplate
} from '@/services/contract-template.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ICreateContractTemplateDTO, IUpdateContractTemplateDTO } from '../../../backend/types'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import { useToast } from '@/hooks/useToast'

interface IUseContractTemplatesOptions {
  path?: string
}

function useContractTemplates({ path }: IUseContractTemplatesOptions = {}) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const setDialogOpen = useAppStore((store) => store.setDialogOpen)
  // Query for all templates
  const {
    data: templates = [],
    isLoading: templatesLoading,
    error: templatesError
  } = useQuery({
    queryKey: [QUERY_KEYS.CONTRACT_TEMPLATES],
    queryFn: getAllTemplates
  })

  // Query for specific template by file path
  const {
    data: template,
    isLoading: templateLoading,
    error: templateError
  } = useQuery({
    queryKey: [QUERY_KEYS.CONTRACT_TEMPLATE, path],
    queryFn: () => getTemplateByFilePath(path!),
    enabled: !!path
  })

  // Check if a file name already exists in the database
  const checkFileNameExists = (fileName: string, excludeId?: number): boolean => {
    return templates.some((t) => {
      const templateFileName = t.file_path.split(/[/\\]/).pop()
      const currentFileName = fileName.split(/[/\\]/).pop()
      return templateFileName === currentFileName && t.id !== excludeId
    })
  }

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: (data: ICreateContractTemplateDTO) => createTemplate(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTRACT_TEMPLATES] })
      toast.success(t('ContractTemplates.templateCreated'))
      setDialogOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || t('Common.error'))
    }
  })

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IUpdateContractTemplateDTO }) =>
      updateTemplate(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTRACT_TEMPLATES] })
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTRACT_TEMPLATE] })
      toast.success(t('ContractTemplates.templateUpdated'))
      setDialogOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || t('Common.error'))
    }
  })

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTemplate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTRACT_TEMPLATES] })
      toast.success(t('ContractTemplates.templateDeleted'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('Common.error'))
    }
  })

  return {
    // Data
    templates,
    template,

    // Loading states
    templatesLoading,
    templateLoading,
    isLoading: templatesLoading || templateLoading,

    // Errors
    templatesError,
    templateError,

    // Mutations
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,

    // Utility functions
    checkFileNameExists
  }
}

export default useContractTemplates
