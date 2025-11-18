import { useEffect, useState } from 'react'
import { Download, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useTranslation } from 'react-i18next'
import { logger } from '@/utils/logger'

function CheckForUpdates(): React.JSX.Element {
  const { t } = useTranslation()
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'error' | 'downloaded'>(
    'idle'
  )
  const [percent, setPercent] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const hasUpdater = typeof window !== 'undefined' && !!window.api

  useEffect(() => {
    if (!hasUpdater) {
      logger.warn('Updater API not available')
      return
    }

    const offStatus = window.api.onUpdaterStatus((p) => {
      setStatus(p.state)
      logger.info('Updater status changed', p)

      if (p.state === 'available' || p.state === 'downloaded') {
        setIsOpen(true)
      }
    })

    const offProgress = window.api.onUpdaterProgress((p) => {
      setPercent(p.percent)
      logger.debug(`Update progress: ${Math.round(p.percent)}%`)
    })

    return () => {
      offStatus()
      offProgress()
    }
  }, [hasUpdater])

  const checkNow = async (): Promise<void> => {
    if (!hasUpdater) {
      logger.warn('Cannot check for updates: API not available')
      return
    }

    setIsOpen(true)
    setStatus('checking')

    try {
      const res = await window.api.checkForUpdates()
      logger.info('Update check completed', res)
    } catch (e) {
      logger.error('Update check failed', e)
      setStatus('error')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
      case 'available':
        return <Download className="h-5 w-5 text-blue-500" />
      case 'downloaded':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <RefreshCw className="h-5 w-5" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return t('CheckForUpdates.checking', 'Checking for updates...')
      case 'available':
        return t('CheckForUpdates.available', 'Update available!')
      case 'downloaded':
        return t('CheckForUpdates.downloaded', 'Update ready to install')
      case 'error':
        return t('CheckForUpdates.error', 'Failed to check for updates')
      default:
        return t('CheckForUpdates.upToDate', 'You are up to date')
    }
  }

  const getStatusDescription = () => {
    switch (status) {
      case 'checking':
        return t('CheckForUpdates.checkingDesc', 'Please wait while we check for updates...')
      case 'available':
        return t(
          'CheckForUpdates.availableDesc',
          'A new version is available and will be downloaded automatically.'
        )
      case 'downloaded':
        return t(
          'CheckForUpdates.downloadedDesc',
          'Update has been downloaded successfully. Restart the application to install the new version.'
        )
      case 'error':
        return t(
          'CheckForUpdates.errorDesc',
          'Unable to check for updates. Please try again later.'
        )
      default:
        return t('CheckForUpdates.idleDesc', 'Click the button to check for available updates.')
    }
  }

  if (!hasUpdater) {
    return <></>
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={checkNow}
          disabled={status === 'checking'}
          title={t('CheckForUpdates.tooltip', 'Check for updates')}
        >
          {getStatusIcon()}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusText()}
          </DialogTitle>
          <DialogDescription>{getStatusDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {status === 'checking' && (
            <div className="space-y-2">
              <Progress value={0} className="animate-pulse" />
              <p className="text-muted-foreground text-center text-sm">
                {t('CheckForUpdates.searching', 'Searching for updates...')}
              </p>
            </div>
          )}

          {status === 'available' && percent > 0 && percent < 100 && (
            <div className="space-y-2">
              <Progress value={percent} />
              <p className="text-muted-foreground text-center text-sm">
                {t('CheckForUpdates.downloading', 'Downloading update...')} {percent.toFixed(1)}%
              </p>
            </div>
          )}

          {status === 'downloaded' && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  {t('CheckForUpdates.readyToInstall', 'Update ready to install')}
                </p>
              </div>
              <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                {t(
                  'CheckForUpdates.restartPrompt',
                  'The application will automatically update when you restart it.'
                )}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  {t('CheckForUpdates.updateError', 'Update check failed')}
                </p>
              </div>
            </div>
          )}

          {status === 'idle' && (
            <Button onClick={checkNow} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('CheckForUpdates.checkNow', 'Check for Updates')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CheckForUpdates
