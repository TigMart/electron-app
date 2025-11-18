import { StateCreator } from 'zustand'

export type IContractTemplateState = {
  dialogOpen: boolean
  mode: 'new' | 'edit'
  filePath: string
  setFilePath: (path: string) => void
  setMode: (mode: 'new' | 'edit') => void
  setDialogOpen: (open: boolean) => void
}

export const createContractTemplateSlice: StateCreator<
  IContractTemplateState,
  [],
  [],
  IContractTemplateState
> = (set) => ({
  dialogOpen: false,
  mode: 'new',
  filePath: '',
  setFilePath: (path: string) => set({ filePath: path }),
  setMode: (mode: 'new' | 'edit') => set({ mode }),
  setDialogOpen: (open: boolean) => set({ dialogOpen: open })
})
