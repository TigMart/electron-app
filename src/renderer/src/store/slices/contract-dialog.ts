import { StateCreator } from 'zustand'
import type { IContract } from '@/types'

export type IContractDialogState = {
  isOpen: boolean
  selectedContract: IContract | null
  openCreateDialog: () => void
  openEditDialog: (contract: IContract) => void
  closeDialog: () => void
}

export const createContractDialogSlice: StateCreator<
  IContractDialogState,
  [],
  [],
  IContractDialogState
> = (set) => ({
  isOpen: false,
  selectedContract: null,
  openCreateDialog: () => set({ isOpen: true, selectedContract: null }),
  openEditDialog: (contract: IContract) => set({ isOpen: true, selectedContract: contract }),
  closeDialog: () => set({ isOpen: false, selectedContract: null })
})
