/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import type { UploadFile, UploadProgress } from '@/types/fileManager'
import { useToast } from './useToast'

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'gif', 'webp']

export function useDnD(currentPath: string | null, onRefresh: () => void) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const toast = useToast()

  // Setup progress listener
  useEffect(() => {
    const unsubscribe = window.fileManager.onUploadProgress((progress) => {
      setUploadProgress((prev) => {
        const newProgress = [...prev]
        newProgress[progress.fileIndex] = progress
        return newProgress
      })
    })

    return unsubscribe
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (!currentPath) {
        toast.error('No folder selected')
        return
      }

      const items = Array.from(e.dataTransfer.files)
      const files: UploadFile[] = []

      // Filter and validate files
      for (const file of items) {
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
          toast.warning(`Skipped ${file.name}: file type not allowed`)
          continue
        }

        // In Electron, File objects have a path property
        const filePath = (file as any).path || file.name

        files.push({
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type
        })
      }

      if (files.length === 0) {
        toast.error('No valid files to upload')
        return
      }

      // Initialize progress
      setUploadProgress(
        files.map((f, i) => ({
          fileIndex: i,
          fileName: f.name,
          bytesTransferred: 0,
          totalBytes: f.size,
          percent: 0,
          status: 'pending' as const
        }))
      )
      setIsUploading(true)

      try {
        const result = await window.fileManager.upload(files, currentPath, {
          allowedTypes: true,
          onConflict: 'skip'
        })

        if (result.uploaded > 0) {
          toast.success(`Uploaded ${result.uploaded} file(s)`)
        }

        if (result.skipped > 0) {
          toast.info(`Skipped ${result.skipped} file(s)`)
        }

        if (result.failed > 0) {
          toast.error(`Failed to upload ${result.failed} file(s)`)
        }

        onRefresh()
      } catch (err: any) {
        toast.error(err.message || 'Upload failed')
      } finally {
        setIsUploading(false)
        setTimeout(() => setUploadProgress([]), 2000)
      }
    },
    [currentPath, onRefresh, toast]
  )

  return {
    isDragging,
    isUploading,
    uploadProgress,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}
