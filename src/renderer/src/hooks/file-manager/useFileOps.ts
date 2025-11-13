/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react'
import type { RenameConflict, ConflictResolution } from '../../types/fileManager'
import { useToast } from './useToast'
import { logger } from '../../utils/logger'

export function useFileOps(onRefresh: () => void) {
  const [renameConflict, setRenameConflict] = useState<RenameConflict | null>(null)
  const [pendingRename, setPendingRename] = useState<{
    oldPath: string
    newName: string
    options?: any
  } | null>(null)
  const toast = useToast()

  const rename = useCallback(
    async (oldPath: string, newName: string, options?: any) => {
      logger.debug(`useFileOps rename called: ${oldPath} -> ${newName}`)
      try {
        const result = await window.fileManager.rename(oldPath, newName, options)
        logger.debug('Rename result', result)

        if (!result.success && result.conflict) {
          // Show conflict dialog
          setRenameConflict(result.conflict)
          setPendingRename({ oldPath, newName, options })
          return
        }

        toast.success('File renamed successfully')
        onRefresh()
      } catch (err: any) {
        logger.error('Rename error', err)
        toast.error(err.message || 'Failed to rename file')
      }
    },
    [onRefresh, toast]
  )

  const resolveConflict = useCallback(
    async (resolution: ConflictResolution) => {
      if (!renameConflict || !pendingRename) return

      try {
        if (resolution === 'cancel') {
          setRenameConflict(null)
          setPendingRename(null)
          return
        }

        const result = await window.fileManager.resolveConflict(
          renameConflict.path,
          renameConflict.newName,
          resolution
        )

        if (!result.success || !result.finalName) {
          setRenameConflict(null)
          setPendingRename(null)
          return
        }

        // Now perform the actual rename with the resolved name
        const finalPath = await window.fileManager.joinPath(
          renameConflict.path,
          renameConflict.oldName
        )

        await window.fileManager.rename(finalPath, result.finalName, {
          ...pendingRename.options,
          preserveExtension: false // Already handled
        })

        toast.success('File renamed successfully')
        setRenameConflict(null)
        setPendingRename(null)
        onRefresh()
      } catch (err: any) {
        toast.error(err.message || 'Failed to resolve conflict')
        setRenameConflict(null)
        setPendingRename(null)
      }
    },
    [renameConflict, pendingRename, onRefresh, toast]
  )

  const remove = useCallback(
    async (paths: string[], toTrash = true) => {
      logger.debug(`useFileOps remove called: ${paths.length} items`)
      try {
        await window.fileManager.remove(paths, { toTrash })
        logger.debug('Remove successful')
        toast.success(`${paths.length} item(s) deleted`)
        onRefresh()
      } catch (err: any) {
        logger.error('Remove error', err)
        toast.error(err.message || 'Failed to delete')
      }
    },
    [onRefresh, toast]
  )

  const copy = useCallback(
    async (sourcePaths: string[], destPath: string) => {
      logger.debug(`useFileOps copy called: ${sourcePaths.length} items to ${destPath}`)
      try {
        await window.fileManager.copy(sourcePaths, destPath)
        logger.debug('Copy successful')
        toast.success(`${sourcePaths.length} item(s) copied`)
        onRefresh()
      } catch (err: any) {
        logger.error('Copy error', err)
        toast.error(err.message || 'Failed to copy')
      }
    },
    [onRefresh, toast]
  )

  const move = useCallback(
    async (sourcePaths: string[], destPath: string) => {
      logger.debug(`useFileOps move called: ${sourcePaths.length} items to ${destPath}`)
      try {
        await window.fileManager.move(sourcePaths, destPath)
        logger.debug('Move successful')
        toast.success(`${sourcePaths.length} item(s) moved`)
        onRefresh()
      } catch (err: any) {
        logger.error('Move error', err)
        toast.error(err.message || 'Failed to move')
      }
    },
    [onRefresh, toast]
  )

  const createFolder = useCallback(
    async (parentPath: string, folderName: string) => {
      logger.debug(`useFileOps createFolder called: ${folderName} in ${parentPath}`)
      try {
        await window.fileManager.createFolder(parentPath, folderName)
        logger.debug('CreateFolder successful')
        toast.success('Folder created')
        onRefresh()
      } catch (err: any) {
        console.error('[DEBUG] CreateFolder error:', err)
        toast.error(err.message || 'Failed to create folder')
      }
    },
    [onRefresh, toast]
  )

  return {
    rename,
    remove,
    copy,
    move,
    createFolder,
    renameConflict,
    resolveConflict
  }
}
