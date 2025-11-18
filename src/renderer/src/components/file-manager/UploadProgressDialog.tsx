import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Loader2, FileIcon, CheckCircle2, XCircle } from 'lucide-react'
import type { UploadProgress } from '@/types/fileManager'
import { useTranslation } from 'react-i18next'

interface UploadProgressDialogProps {
  open: boolean
  uploadProgress: UploadProgress[]
  onCancel?: () => void
}

export function UploadProgressDialog({
  open,
  uploadProgress,
  onCancel
}: UploadProgressDialogProps) {
  const { t } = useTranslation()
  const totalFiles = uploadProgress.length
  const completedFiles = uploadProgress.filter((p) => p.status === 'complete').length
  const failedFiles = uploadProgress.filter((p) => p.status === 'error').length

  const overallPercent =
    totalFiles > 0
      ? Math.round(uploadProgress.reduce((sum, p) => sum + p.percent, 0) / totalFiles)
      : 0

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            {t('UploadProgress.uploadingFiles', { count: totalFiles })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('UploadProgress.overall', { completed: completedFiles, total: totalFiles })}
              </span>
              <span className="font-medium">{overallPercent}%</span>
            </div>
            <Progress value={overallPercent} className="h-2" />
          </div>

          {/* Individual Files */}
          <div className="max-h-[300px] space-y-3 overflow-y-auto">
            {uploadProgress.map((progress, index) => (
              <div key={index} className="flex items-start gap-3 rounded-lg border bg-muted/50 p-3">
                {/* File Icon */}
                <div className="mt-1 shrink-0">
                  {progress.status === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : progress.status === 'error' ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* File Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium">{progress.fileName}</p>

                  {/* Progress Bar */}
                  {progress.status !== 'error' && progress.status !== 'complete' && (
                    <div className="space-y-1">
                      <Progress value={progress.percent} className="h-1" />
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(progress.bytesTransferred)} of{' '}
                        {formatBytes(progress.totalBytes)}
                      </p>
                    </div>
                  )}

                  {/* Status */}
                  {progress.status === 'complete' ? (
                    <p className="text-xs text-green-600">{t('UploadProgress.completed')}</p>
                  ) : progress.status === 'error' ? (
                    <p className="text-xs text-destructive">
                      {t('UploadProgress.failed', {
                        error: ('error' in progress ? progress.error : null) || 'Unknown error'
                      })}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          {onCancel && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onCancel}>
                {t('Common.cancel')}
              </Button>
            </div>
          )}

          {/* Summary */}
          {failedFiles > 0 && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                {failedFiles} file{failedFiles !== 1 ? 's' : ''} failed to upload
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
