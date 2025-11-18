import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SiteHeader } from '@/components/layout/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ThemeProvider } from '@/components/helper/theme-provider'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import useSettings from '@/hooks/use-settings'

/**
 * Main App Layout Component
 * Wraps all pages with sidebar and header
 * Uses Outlet for nested routing
 */

function App(): React.JSX.Element {
  const { settings } = useSettings()

  // Set root path globally when settings load
  useEffect(() => {
    if (settings?.contract_templates_dir) {
      window.fileManager.setRootPath(settings.contract_templates_dir).catch((error) => {
        console.error('Failed to set root path:', error)
      })
    }
  }, [settings?.contract_templates_dir])

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
        <AppSidebar variant="inset" />
        <SidebarInset>
          <Toaster position="top-right" />

          <SiteHeader />
          {/* Outlet renders the matched child route */}
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App
