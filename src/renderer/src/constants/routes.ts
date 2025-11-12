/**
 * Application route paths
 * Centralized route definitions to maintain consistency across the app
 */
export const ROUTES = {
  DASHBOARD: '/',
  CONTRACTS: '/contracts',
  FILES: '/files',
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
  { path: ROUTES.CONTRACTS, label: 'Contracts' },
  { path: ROUTES.FILES, label: 'Files' }
]
