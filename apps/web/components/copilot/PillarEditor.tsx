import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogContent, DialogFooter, Input, TextArea } from "@quillsocial/ui";
import { Plus, Trash2 } from "@quillsocial/ui/components/icon";
import classNames from "classnames";
import { PlanPillar } from "./types";
import { createId } from "./utils";

interface PillarEditorProps {
  open: boolean;
  pillars: PlanPillar[];
  onClose: () => void;
  onSave: (pillars: PlanPillar[]) => void;
}

const colorChoices = ["#6366F1", "#F97316", "#22C55E", "#0EA5E9", "#EC4899", "#F59E0B", "#8B5CF6", "#14B8A6"];

export const PillarEditor: React.FC<PillarEditorProps> = ({ open, pillars, onClose, onSave }) => {
  const [localPillars, setLocalPillars] = useState<PlanPillar[]>(pillars);

  useEffect(() => {
    setLocalPillars(pillars);
  }, [pillars]);

  const handleChange = (id: string, key: keyof PlanPillar, value: string) => {
    setLocalPillars((prev) => prev.map((pillar) => (pillar.id === id ? { ...pillar, [key]: value } : pillar)));
  };

  const handleAdd = () => {
    setLocalPillars((prev) => [
      ...prev,
      { id: createId(), name: "New Pillar", color: colorChoices[prev.length % colorChoices.length] },
    ]);
  };

  const handleRemove = (id: string) => {
    setLocalPillars((prev) => prev.filter((pillar) => pillar.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="max-w-2xl">
        <div className="space-y-4">
          {localPillars.map((pillar) => (
            <div key={pillar.id} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input value={pillar.name} onChange={(e) => handleChange(pillar.id, "name", e.target.value)} placeholder="Pillar name" />
              <div className="flex items-center gap-2">
                <Input value={pillar.color} onChange={(e) => handleChange(pillar.id, "color", e.target.value)} placeholder="#6366F1" />
                <div className="flex gap-1">
                  {colorChoices.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={classNames("h-7 w-7 rounded border", pillar.color === color ? "border-slate-600" : "border-slate-200")}
                      style={{ backgroundColor: color }}
                      onClick={() => handleChange(pillar.id, "color", color)}
                    />
                  ))}
                </div>
              </div>
              <Button variant="icon" color="minimal" size="sm" aria-label="Remove pillar" onClick={() => handleRemove(pillar.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          <Button color="minimal" onClick={handleAdd} StartIcon={Plus}>
            Add pillar
          </Button>
        </div>
        <DialogFooter className="gap-2">
          <Button color="minimal" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => { onSave(localPillars.filter((p) => p.name.trim().length > 0)); onClose(); }}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

