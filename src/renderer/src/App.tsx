import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ThemeProvider } from '@/components/helper/theme-provider'

/**
 * Main App Layout Component
 * Wraps all pages with sidebar and header
 * Uses Outlet for nested routing
 */

function App(): React.JSX.Element {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)'
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" suppressHydrationWarning />
        <SidebarInset>
          <SiteHeader />
          {/* Outlet renders the matched child route */}
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App
