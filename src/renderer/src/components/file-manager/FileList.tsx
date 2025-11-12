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
  onNavigateUp: () => void
  canNavigateUp: boolean
}

export function FileList({
  files,
  selectedFiles,
  onFileSelect,
  onFileRename,
  onFileOpen,
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {canNavigateUp && (
            <tr className="hover:bg-muted/50 cursor-pointer" onClick={onNavigateUp}>
              <td className="p-2"></td>
              <td className="p-2" colSpan={4}>
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
            />
          ))}

          {files.length === 0 && !canNavigateUp && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-muted-foreground">
                No files or folders
              </td>
            </tr>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
