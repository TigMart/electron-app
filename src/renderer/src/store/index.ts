import { create } from 'zustand'
import { createContractTemplateSlice, IContractTemplateState } from './slices/contract-template'
import { createContractDialogSlice, IContractDialogState } from './slices/contract-dialog'
import { devtools } from 'zustand/middleware'

export type AppStore = IContractTemplateState & IContractDialogState

export const useAppStore = create<AppStore>()(
  devtools((...a) => ({
    ...createContractTemplateSlice(...a),
    ...createContractDialogSlice(...a)
  }))
)
