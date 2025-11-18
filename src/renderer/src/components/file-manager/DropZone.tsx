import { IconUpload } from '@tabler/icons-react'
import type { UploadProgress } from '@/types/fileManager'
import { useTranslation } from 'react-i18next'

interface DropZoneProps {
  isDragging: boolean
  isUploading: boolean
  uploadProgress: UploadProgress[]
  onDragEnter: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  children: React.ReactNode
}

export function DropZone({
  isDragging,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  children
}: DropZoneProps) {
  const { t } = useTranslation()

  return (
    <div
      className="relative flex-1"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}

      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10">
          <div className="text-center">
            <IconUpload size={48} className="mx-auto mb-2 text-primary" />
            <p className="text-lg font-semibold">{t('FileManager.dropFilesHere')}</p>
            <p className="text-sm text-muted-foreground">{t('FileManager.supportedFormats')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
