import { IconContract, IconDashboard, IconFolder } from '@tabler/icons-react'
import { ROUTES } from './routes'

export const data = {
  navMain: [
    {
      title: 'Navigation.Dashboard',
      url: ROUTES.DASHBOARD,
      icon: IconDashboard
    },
    {
      title: 'Navigation.Contracts',
      url: ROUTES.CONTRACTS,
      icon: IconContract
    },
    {
      title: 'Navigation.Files',
      url: ROUTES.FILES,
      icon: IconFolder
    }
  ]
}
