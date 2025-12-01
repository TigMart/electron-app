import { IconContract, IconDashboard, IconSettings } from '@tabler/icons-react'
import { ROUTES } from './routes'

export const data = {
  navMain: [
    {
      title: 'Navigation.Dashboard',
      url: ROUTES.DASHBOARD,
      icon: IconDashboard
    },
    {
      title: 'Navigation.ContractTemplates',
      url: ROUTES.CONTRACT_TEMPLATES,
      icon: IconContract
    },
    {
      title: 'Navigation.Contracts',
      url: ROUTES.CONTRACTS,
      icon: IconContract
    },
    {
      title: 'Navigation.GeneratedContracts',
      url: ROUTES.GENERATED_CONTRACTS,
      icon: IconContract
    },
    {
      title: 'Navigation.Settings',
      url: ROUTES.SETTINGS,
      icon: IconSettings
    }
  ]
}
