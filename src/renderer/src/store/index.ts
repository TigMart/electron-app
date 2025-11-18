import { create } from 'zustand'
import { createContractTemplateSlice, IContractTemplateState } from './slices/contract-template'
import { devtools } from 'zustand/middleware'

export type AppStore = IContractTemplateState

export const useAppStore = create<AppStore>()(
  devtools((...a) => ({
    ...createContractTemplateSlice(...a)
  }))
)
