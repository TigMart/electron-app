import { QUERY_KEYS } from '@/constants/query-keys'
import {
  getAllContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract
} from '@/services/contract.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ICreateContractDTO, IUpdateContractDTO } from '../../../types'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/hooks/useToast'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

interface IUseContractsOptions {
  id?: number
}

function useContracts({ id }: IUseContractsOptions = {}) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Query for all contracts
  const {
    data: contracts = [],
    isLoading: contractsLoading,
    error: contractsError
  } = useQuery({
    queryKey: [QUERY_KEYS.CONTRACTS],
    queryFn: getAllContracts
  })

  // Query for specific contract by id
  const {
    data: contract,
    isLoading: contractLoading,
    error: contractError
  } = useQuery({
    queryKey: [QUERY_KEYS.CONTRACT, id],
    queryFn: () => getContractById(id!),
    enabled: !!id
  })

  // Create contract mutation
  const createMutation = useMutation({
    mutationFn: (data: ICreateContractDTO) => createContract(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTRACTS] })
      toast.success(t('Contracts.contractCreated'))
      navigate(ROUTES.CONTRACTS)
    },
    onError: (error: Error) => {
      toast.error(error.message || t('Common.error'))
    }
  })

  // Update contract mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IUpdateContractDTO }) =>
      updateContract(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTRACTS] })
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTRACT] })
      toast.success(t('Contracts.contractUpdated'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('Common.error'))
    }
  })

  // Delete contract mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteContract(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTRACTS] })
      toast.success(t('Contracts.contractDeleted'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('Common.error'))
    }
  })

  return {
    // Data
    contracts,
    contract,

    // Loading states
    contractsLoading,
    contractLoading,
    isLoading: contractsLoading || contractLoading,

    // Errors
    contractsError,
    contractError,

    // Mutations
    createContract: createMutation.mutateAsync,
    updateContract: updateMutation.mutateAsync,
    deleteContract: deleteMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  }
}

export default useContracts
