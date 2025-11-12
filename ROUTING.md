# Routing Implementation Guide

This project uses React Router v7 for client-side routing with a centralized, type-safe route configuration.

## 📁 File Structure

```
src/renderer/src/
├── constants/
│   └── routes.ts          # Centralized route definitions
├── hooks/
│   └── useNavigation.ts   # Custom navigation hooks
├── pages/
│   ├── HomePage.tsx
│   ├── DashboardPage.tsx
│   ├── SettingsPage.tsx
│   ├── DocumentsPage.tsx
│   └── NotFoundPage.tsx
├── App.tsx                # Layout component with Outlet
└── main.tsx               # Router setup with Routes
```

## 🎯 Key Concepts

### 1. Centralized Routes (`constants/routes.ts`)

All route paths are defined in one place for consistency and type safety:

```typescript
import { ROUTES } from './constants/routes'

// Use typed route constants instead of hardcoded strings
<Link to={ROUTES.DASHBOARD}>Dashboard</Link>
```

### 2. Layout with Outlet (`App.tsx`)

The `App` component serves as a layout wrapper:

- Renders sidebar and header once
- Uses `<Outlet />` to render child routes
- All pages share the same layout automatically

### 3. Route Configuration (`main.tsx`)

Routes are configured using nested structure:

```typescript
<Route path="/" element={<App />}>
  <Route index element={<HomePage />} />
  <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
  {/* More routes... */}
</Route>
```

## 🔧 Usage Examples

### Navigate Programmatically

```typescript
import { useAppNavigate } from './hooks/useNavigation'
import { ROUTES } from './constants/routes'

function MyComponent() {
  const navigate = useAppNavigate()

  const goToDashboard = () => {
    navigate(ROUTES.DASHBOARD)
  }

  return <button onClick={goToDashboard}>Go to Dashboard</button>
}
```

### Check Active Route

```typescript
import { useIsActiveRoute } from './hooks/useNavigation'
import { ROUTES } from './constants/routes'

function NavLink() {
  const isActive = useIsActiveRoute(ROUTES.DASHBOARD)

  return (
    <Link
      to={ROUTES.DASHBOARD}
      className={isActive ? 'active' : ''}
    >
      Dashboard
    </Link>
  )
}
```

### Use Link Component

```typescript
import { Link } from 'react-router-dom'
import { ROUTES } from './constants/routes'

function Navigation() {
  return (
    <nav>
      <Link to={ROUTES.HOME}>Home</Link>
      <Link to={ROUTES.DASHBOARD}>Dashboard</Link>
      <Link to={ROUTES.SETTINGS}>Settings</Link>
    </nav>
  )
}
```

## ➕ Adding New Routes

1. **Add route constant** in `constants/routes.ts`:

```typescript
export const ROUTES = {
  // ... existing routes
  PROFILE: '/profile'
} as const
```

2. **Create page component** in `pages/`:

```typescript
// pages/ProfilePage.tsx
export default function ProfilePage() {
  return <div>Profile Page</div>
}
```

3. **Add route** in `main.tsx`:

```typescript
import ProfilePage from './pages/ProfilePage'

<Route path={ROUTES.PROFILE} element={<ProfilePage />} />
```

4. **Add to navigation** (optional) in `constants/routes.ts`:

```typescript
export const NAVIGATION_ROUTES: RouteConfig[] = [
  // ... existing routes
  { path: ROUTES.PROFILE, label: 'Profile' }
]
```

## 🚀 Advanced Features

### Lazy Loading (Optional)

For better performance, you can lazy load pages:

```typescript
import { lazy, Suspense } from 'react'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))

<Route
  path={ROUTES.DASHBOARD}
  element={
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardPage />
    </Suspense>
  }
/>
```

### Protected Routes

Create a wrapper component for authenticated routes:

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuth() // Your auth logic

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  return children
}

// Usage
<Route
  path={ROUTES.DASHBOARD}
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

### Route Parameters

```typescript
// In routes.ts
export const ROUTES = {
  USER_PROFILE: '/users/:id',
} as const

// In component
import { useParams } from 'react-router-dom'

function UserProfile() {
  const { id } = useParams()
  return <div>User {id}</div>
}
```

## ✅ Benefits

1. **Type Safety**: TypeScript ensures you only use valid route paths
2. **Single Source of Truth**: All routes defined in one place
3. **Easy Refactoring**: Change a route path in one location
4. **Better IntelliSense**: Autocomplete for route paths
5. **Maintainability**: Clear structure and organization
6. **Performance**: Layout renders once, only content changes

## 📝 Notes

- Use `<Link>` for navigation instead of `<a>` tags
- Always import routes from `constants/routes.ts`
- Use custom hooks from `hooks/useNavigation.ts` for type safety
- The 404 page catches all unmatched routes with `path="*"`
