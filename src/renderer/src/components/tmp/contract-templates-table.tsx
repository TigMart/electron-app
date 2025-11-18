import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { toast } from 'sonner'
import type { IContractTemplate } from '../../../../backend/types'

interface IContractTemplatesTableProps {
  templates: IContractTemplate[]
  onEdit: (template: IContractTemplate) => void
  onDelete: (id: number) => void
}

export function ContractTemplatesTable({
  templates,
  onEdit,
  onDelete
}: IContractTemplatesTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    setDeletingId(id)

    try {
      const { deleteTemplate } = await import('../../services/contract-template.service')
      await deleteTemplate(id)
      toast.success('Template deleted successfully')
      onDelete(id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete template')
    } finally {
      setDeletingId(null)
    }
  }

  const handleOpenFile = async (filePath: string): Promise<void> => {
    try {
      await window.fileManager.openFile(filePath)
    } catch {
      toast.error('Failed to open file')
    }
  }

  const handleOpenInExplorer = async (filePath: string): Promise<void> => {
    try {
      await window.fileManager.openInExplorer(filePath)
    } catch {
      toast.error('Failed to open in explorer')
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No contract templates found. Create one to get started.
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>File Path</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell className="font-medium">{template.title}</TableCell>
              <TableCell>
                <Badge variant="secondary">{template.type}</Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate" title={template.file_path}>
                {template.file_path}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(template.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenFile(template.file_path)}
                  >
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenInExplorer(template.file_path)}
                  >
                    Show
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onEdit(template)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(template.id)}
                    disabled={deletingId === template.id}
                  >
                    {deletingId === template.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
