import './assets/globals.css'
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { ROUTES } from './constants/routes'
import { BeatLoader } from 'react-spinners'
import './i18n'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'

// Lazy load pages for better performance
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ContractTemplatesPage = lazy(() => import('./pages/ContractTemplatesPage'))
const ContractsPage = lazy(() => import('./pages/ContractsPage'))
const ContractDetailPage = lazy(() => import('./pages/ContractDetailPage'))
const GeneratedContractsPage = lazy(() => import('./pages/GeneratedContractsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <BeatLoader />
          </div>
        }
      >
        <Routes>
          {/* App layout wraps all routes */}
          <Route
            path="/"
            element={
              <QueryClientProvider client={queryClient}>
                <App />
              </QueryClientProvider>
            }
          >
            {/* Nested routes */}
            <Route index element={<DashboardPage />} />
            <Route path={ROUTES.CONTRACT_TEMPLATES} element={<ContractTemplatesPage />} />
            <Route path={ROUTES.CONTRACTS} element={<ContractsPage />} />
            <Route path={ROUTES.CONTRACT_DETAIL} element={<ContractDetailPage />} />
            <Route path={ROUTES.GENERATED_CONTRACTS} element={<GeneratedContractsPage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />

            {/* 404 catch-all route */}
            <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  </StrictMode>
)
