import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Button } from '../ui/button'
import type { RenameConflict, ConflictResolution } from '../../types/fileManager'

interface ConflictDialogProps {
  conflict: RenameConflict | null
  onResolve: (resolution: ConflictResolution) => void
}

export function ConflictDialog({ conflict, onResolve }: ConflictDialogProps) {
  if (!conflict) return null

  return (
    <Dialog open={!!conflict} onOpenChange={() => onResolve('cancel')}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File Already Exists</DialogTitle>
          <DialogDescription>
            A file named <strong>{conflict.newName}</strong> already exists in this location.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">What would you like to do?</p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onResolve('cancel')}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => onResolve('keep-both')}>
            Keep Both
          </Button>
          <Button variant="default" onClick={() => onResolve('overwrite')}>
            Replace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
