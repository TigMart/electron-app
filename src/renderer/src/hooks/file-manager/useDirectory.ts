/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import type { FileItem } from '@/types/fileManager'
import { useToast } from '../useToast'

interface UseDirectoryOptions {
  showHidden?: boolean
  sortBy?: 'name' | 'type' | 'size' | 'modified'
  sortDirection?: 'asc' | 'desc'
  searchQuery?: string
}

export function useDirectory(currentPath: string | null, options: UseDirectoryOptions = {}) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const loadFiles = useCallback(async () => {
    if (!currentPath) {
      setFiles([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const items = await window.fileManager.listFiles(currentPath, {
        showHidden: options.showHidden ?? false,
        sortBy: options.sortBy,
        sortDirection: options.sortDirection,
        searchQuery: options.searchQuery
      })
      setFiles(items)
    } catch (err: any) {
      const message = err.message || 'Failed to load directory'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, options.searchQuery, options.showHidden, options.sortBy, options.sortDirection])

  // Auto-load when path or options change
  useEffect(() => {
    loadFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, options.searchQuery, options.showHidden, options.sortBy, options.sortDirection])

  return { files, loading, error, refresh: loadFiles }
}
