import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

export default function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to={ROUTES.DASHBOARD}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-flex h-10 items-center justify-center rounded-md px-8 py-2 text-sm font-medium"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
