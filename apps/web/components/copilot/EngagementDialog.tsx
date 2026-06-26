import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, NumberInput } from "@quillsocial/ui";

interface EngagementDialogProps {
  open: boolean;
  current: number;
  onClose: () => void;
  onSave: (value: number) => void;
}

export const EngagementDialog: React.FC<EngagementDialogProps> = ({ open, current, onClose, onSave }) => {
  const [value, setValue] = useState<number>(current);

  useEffect(() => { setValue(current); }, [current, open]);

  return (
    <Dialog open={open} onOpenChange={(dialogOpen) => (!dialogOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-md">
        <DialogHeader title="Adjust replies per day" />
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Your engagement goal feeds the engagement progress bar. Keep it above four to stay consistent.</p>
          <NumberInput value={value} min={1} onChange={(event) => setValue(Number(event.target.value))} />
          <p className="text-xs text-slate-500">Minimum recommended is 4 replies per day.</p>
        </div>
        <DialogFooter className="gap-2">
          <Button color="minimal" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(Math.max(0, value))}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

