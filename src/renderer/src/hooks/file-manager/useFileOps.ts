/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import type { RenameConflict, ConflictResolution } from '../../types/fileManager'
import { useToast } from './useToast'

export function useFileOps(onRefresh: () => void) {
  const [renameConflict, setRenameConflict] = useState<RenameConflict | null>(null)
  const [pendingRename, setPendingRename] = useState<{
    oldPath: string
    newName: string
    options?: any
  } | null>(null)
  const toast = useToast()

  const rename = async (oldPath: string, newName: string, options?: any) => {
    try {
      const result = await window.fileManager.rename(oldPath, newName, options)

      if (!result.success && result.conflict) {
        // Show conflict dialog
        setRenameConflict(result.conflict)
        setPendingRename({ oldPath, newName, options })
        return
      }

      toast.success('File renamed successfully')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to rename file')
    }
  }

  const resolveConflict = async (resolution: ConflictResolution) => {
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
  }

  const remove = async (paths: string[], toTrash = true) => {
    try {
      await window.fileManager.remove(paths, { toTrash })
      toast.success(`${paths.length} item(s) deleted`)
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete')
    }
  }

  const copy = async (sourcePaths: string[], destPath: string) => {
    try {
      await window.fileManager.copy(sourcePaths, destPath)
      toast.success(`${sourcePaths.length} item(s) copied`)
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to copy')
    }
  }

  const move = async (sourcePaths: string[], destPath: string) => {
    try {
      await window.fileManager.move(sourcePaths, destPath)
      toast.success(`${sourcePaths.length} item(s) moved`)
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to move')
    }
  }

  const createFolder = async (parentPath: string, folderName: string) => {
    try {
      await window.fileManager.createFolder(parentPath, folderName)
      toast.success('Folder created')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create folder')
    }
  }

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
