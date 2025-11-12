import './assets/globals.css'
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { ROUTES } from './constants/routes'
import { BeatLoader } from 'react-spinners'
import './i18n'

// Lazy load pages for better performance
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ContractsPage = lazy(() => import('./pages/ContractsPage'))
const FileManagerPage = lazy(() => import('./pages/FileManagerPage'))
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
          <Route path="/" element={<App />}>
            {/* Nested routes */}
            <Route index element={<DashboardPage />} />
            <Route path={ROUTES.CONTRACTS} element={<ContractsPage />} />
            <Route path={ROUTES.FILES} element={<FileManagerPage />} />

            {/* 404 catch-all route */}
            <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  </StrictMode>
)
