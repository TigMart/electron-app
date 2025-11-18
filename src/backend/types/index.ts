export interface IContractTemplate {
  id: number
  title: string
  type: string
  file_path: string
  created_at: string
  updated_at: string
}

export interface ICreateContractTemplateDTO {
  title: string
  type: string
  filePath: string
}

export interface IUpdateContractTemplateDTO {
  title?: string
  type?: string
  filePath?: string
}

export interface ISettings {
  id: number
  contract_templates_dir: string | null
  generated_contracts_dir: string | null
  updated_at: string
}

export interface IUpdateSettingsDTO {
  contractTemplatesDir?: string | null
  generatedContractsDir?: string | null
}
