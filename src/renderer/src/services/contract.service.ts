import type { IContract, ICreateContractDTO, IUpdateContractDTO } from '../../../types'

export async function getAllContracts(): Promise<IContract[]> {
  return window.database.contracts.getAll()
}

export async function getContractById(id: number): Promise<IContract> {
  const contract = await window.database.contracts.getById(id)
  if (!contract) {
    throw new Error(`Contract with id ${id} not found`)
  }
  return contract
}

export async function createContract(data: ICreateContractDTO): Promise<IContract> {
  return window.database.contracts.create(data)
}

export async function updateContract(id: number, data: IUpdateContractDTO): Promise<IContract> {
  const result = await window.database.contracts.update(id, data)
  if (!result) {
    throw new Error(`Contract with id ${id} not found`)
  }
  return result
}

export async function deleteContract(id: number): Promise<void> {
  const success = await window.database.contracts.delete(id)
  if (!success) {
    throw new Error(`Failed to delete contract with id ${id}`)
  }
}
