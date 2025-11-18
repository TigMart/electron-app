/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react'
import type { UploadFile, UploadProgress } from '@/types/fileManager'
import { useToast } from '../useToast'
import { logger } from '../../utils/logger'

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'gif', 'webp']

export function useDnD(currentPath: string | null, onRefresh: () => void) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const dragCounterRef = useRef(0)
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

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      logger.debug('useDnD handleDrop called')
      e.preventDefault()
      e.stopPropagation()

      // Reset drag state immediately
      dragCounterRef.current = 0
      setIsDragging(false)

      if (!currentPath) {
        logger.debug('No currentPath, showing error')
        toast.error('No folder selected')
        return
      }

      const items = Array.from(e.dataTransfer.files)
      logger.debug(`Dropped files: ${items.length}`)
      const files: UploadFile[] = []

      // Filter and validate files
      for (const file of items) {
        const ext = file.name.split('.').pop()?.toLowerCase()
        logger.debug(`File: ${file.name}, Extension: ${ext}`)

        if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
          toast.warning(`Skipped ${file.name}: file type not allowed`)
          continue
        }

        // In Electron, when dragging from file system, File object has a path property
        // If not, we need to read the file as buffer
        const filePath = (file as any).path

        if (filePath) {
          logger.debug(`File path from drag-drop: ${filePath}`)
          files.push({
            name: file.name,
            path: filePath,
            size: file.size,
            type: file.type
          })
        } else {
          // No path property - need to read file as buffer
          logger.debug('No path property, will read file content')
          files.push({
            name: file.name,
            path: '', // Will be handled by reading buffer
            size: file.size,
            type: file.type,
            file: file // Pass the actual File object
          })
        }
      }

      logger.debug(`Valid files to upload: ${files.length}`)
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

      logger.debug('Calling window.fileManager.upload')
      try {
        // For files without path (dragged from outside), we need to save them first
        const filesToUpload = await Promise.all(
          files.map(async (f) => {
            if (!f.path && f.file) {
              // Read file content and save to temp location
              const buffer = await f.file.arrayBuffer()
              const uint8Array = new Uint8Array(buffer)

              // Save to temp file via IPC
              const tempPath = await window.fileManager.saveTempFile(f.name, uint8Array)
              return { ...f, path: tempPath }
            }
            return f
          })
        )

        const result = await window.fileManager.upload(filesToUpload, currentPath, {
          allowedTypes: true,
          onConflict: 'skip'
        })

        logger.debug('Upload result', result)
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
        logger.error('Upload failed', err)
        toast.error(err.message || 'Upload failed')
      } finally {
        setIsUploading(false)
        setTimeout(() => setUploadProgress([]), 2000)
      }
    },
    [currentPath, toast, onRefresh]
  )

  return {
    isDragging,
    isUploading,
    uploadProgress,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}
