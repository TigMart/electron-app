/**
 * Application route paths
 * Centralized route definitions to maintain consistency across the app
 */
export const ROUTES = {
  DASHBOARD: '/',
  CONTRACT_TEMPLATES: '/contract-templates',
  FILES: '/files',
  SETTINGS: '/settings',
  NOT_FOUND: '*'
} as const

/**
 * Type-safe route paths
 */
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]

/**
 * Route metadata for navigation
 */
export interface RouteConfig {
  path: RoutePath
  label: string
  icon?: string
}

/**
 * Navigation menu configuration
 */
export const NAVIGATION_ROUTES: RouteConfig[] = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard' },
  { path: ROUTES.CONTRACT_TEMPLATES, label: 'ContractTemplates' },
  { path: ROUTES.FILES, label: 'Files' },
  { path: ROUTES.SETTINGS, label: 'Settings' }
]
