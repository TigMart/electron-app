import { IconFolderUp } from '@tabler/icons-react'
import type { FileItem } from '../../types/fileManager'
import { FileRow } from './FileRow'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table'

interface FileListProps {
  files: FileItem[]
  selectedFiles: Set<string>
  onFileSelect: (filePath: string, selected: boolean) => void
  onFileRename: (filePath: string, newName: string) => void
  onFileOpen: (file: FileItem) => void
  onFileDelete: (filePath: string) => void
  onFileCopy: (filePath: string) => void
  onFileCut: (filePath: string) => void
  onFileOpenExternal: (filePath: string) => void
  onFileOpenInExplorer: (filePath: string) => void
  onNavigateUp: () => void
  canNavigateUp: boolean
}

export function FileList({
  files,
  selectedFiles,
  onFileSelect,
  onFileRename,
  onFileOpen,
  onFileDelete,
  onFileCopy,
  onFileCut,
  onFileOpenExternal,
  onFileOpenInExplorer,
  onNavigateUp,
  canNavigateUp
}: FileListProps) {
  return (
    <div className="flex-1 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Modified</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {canNavigateUp && (
            <tr className="hover:bg-muted/50 cursor-pointer" onClick={onNavigateUp}>
              <td className="p-2"></td>
              <td className="p-2" colSpan={5}>
                <div className="flex items-center gap-2">
                  <IconFolderUp size={20} className="text-muted-foreground shrink-0" />
                  <span>..</span>
                </div>
              </td>
            </tr>
          )}

          {files.map((file) => (
            <FileRow
              key={file.path}
              file={file}
              isSelected={selectedFiles.has(file.path)}
              onSelect={(selected) => onFileSelect(file.path, selected)}
              onRename={(newName) => onFileRename(file.path, newName)}
              onOpen={() => onFileOpen(file)}
              onDelete={() => onFileDelete(file.path)}
              onCopy={() => onFileCopy(file.path)}
              onCut={() => onFileCut(file.path)}
              onOpenExternal={() => onFileOpenExternal(file.path)}
              onOpenInExplorer={() => onFileOpenInExplorer(file.path)}
            />
          ))}

          {files.length === 0 && !canNavigateUp && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-muted-foreground">
                No files or folders
              </td>
            </tr>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
