import { useNavigate, useLocation, NavigateOptions } from 'react-router-dom'
import { ROUTES, type RoutePath } from '../constants/routes'

/**
 * Custom hook for type-safe navigation
 * Usage: const navigate = useAppNavigate()
 *        navigate(ROUTES.DASHBOARD)
 */
export function useAppNavigate() {
  const navigate = useNavigate()

  return (path: RoutePath, options?: NavigateOptions) => {
    navigate(path, options)
  }
}

/**
 * Custom hook to check if a route is active
 * Usage: const isActive = useIsActiveRoute(ROUTES.DASHBOARD)
 */
export function useIsActiveRoute(path: RoutePath): boolean {
  const location = useLocation()

  if (path === ROUTES.DASHBOARD) {
    return location.pathname === path
  }

  return location.pathname.startsWith(path)
}

/**
 * Custom hook to get current route info
 */
export function useCurrentRoute() {
  const location = useLocation()

  const currentRoute = Object.entries(ROUTES).find(([, path]) => path === location.pathname)

  return {
    path: location.pathname as RoutePath,
    routeName: currentRoute?.[0] || 'UNKNOWN',
    search: location.search,
    hash: location.hash,
    state: location.state
  }
}
