import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, TextArea } from "@quillsocial/ui";
import { TargetPlatform, Target } from "./types";
import { createId } from "./utils";

interface ImportTargetsDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (items: Target[]) => void;
}

const guessPlatform = (handle: string): TargetPlatform => {
  if (handle.startsWith("@")) return "x";
  if (handle.includes("linkedin")) return "linkedin";
  if (handle.includes("youtube") || handle.includes("youtu")) return "youtube";
  if (handle.includes("instagram")) return "instagram";
  if (handle.includes("http")) return "other";
  return "x";
};

export const ImportTargetsDialog: React.FC<ImportTargetsDialogProps> = ({ open, onClose, onImport }) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => { if (!open) setInputValue(""); }, [open]);

  const handleImport = () => {
    const rows = inputValue.split(/\n|,/).map((row) => row.trim()).filter(Boolean);
    const targets = rows.map((handle) => ({ id: createId(), handle, platform: guessPlatform(handle) }));
    onImport(targets);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="max-w-lg">
        <DialogHeader title="Import targets" />
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Paste handles or URLs. One per line. We will detect the platform when possible.</p>
          <TextArea rows={8} value={inputValue} onChange={(event) => setInputValue(event.target.value)} placeholder={`@levelsio\nhttps://www.linkedin.com/in/revenueops\nfrontend.focus`} />
        </div>
        <DialogFooter className="gap-2">
          <Button color="minimal" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={!inputValue.trim()}>Import handles</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

