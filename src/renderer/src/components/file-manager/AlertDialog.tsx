import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  details?: string
}

export function AlertDialog({ open, onOpenChange, title, message, details }: AlertDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{message}</DialogDescription>
        </DialogHeader>

        {details && (
          <div className="rounded-md bg-muted p-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded bg-yellow-100 dark:bg-yellow-900/20">
                  <svg
                    className="h-8 w-8 text-yellow-600 dark:text-yellow-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{details}</p>
                <p className="text-xs text-muted-foreground">
                  Date created:{' '}
                  {new Date().toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Common.ok')}
          </Button>
          <Button onClick={() => onOpenChange(false)}>{t('Common.cancel')}</Button>
        </DialogFooter>

        {details && (
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              // Toggle details - for now just close
              onOpenChange(false)
            }}
          >
            <span>▲</span>
            <span>Fewer details</span>
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}
