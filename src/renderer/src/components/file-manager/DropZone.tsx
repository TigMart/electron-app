import { IconUpload } from '@tabler/icons-react'
import type { UploadProgress } from '../../types/fileManager'

interface DropZoneProps {
  isDragging: boolean
  isUploading: boolean
  uploadProgress: UploadProgress[]
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  children: React.ReactNode
}

export function DropZone({
  isDragging,
  isUploading,
  uploadProgress,
  onDragOver,
  onDragLeave,
  onDrop,
  children
}: DropZoneProps) {
  return (
    <div
      className="relative flex-1"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}

      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-50">
          <div className="text-center">
            <IconUpload size={48} className="mx-auto mb-2 text-primary" />
            <p className="text-lg font-semibold">Drop files here</p>
            <p className="text-sm text-muted-foreground">PDF, DOC, DOCX, PNG, JPG, GIF, WebP</p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg border min-w-80">
            <h3 className="font-semibold mb-4">Uploading Files...</h3>
            <div className="space-y-2">
              {uploadProgress.map((progress, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{progress.fileName}</span>
                    <span className="text-muted-foreground">{Math.round(progress.percent)}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
