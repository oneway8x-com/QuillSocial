import React, { useEffect, useState } from "react";
import { Button, Input, Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, Tooltip } from "@quillsocial/ui";
import { Download, Plus, Trash2 } from "@quillsocial/ui/components/icon";
import classNames from "classnames";
import { PlanTargets, Target, TargetPlatform } from "./types";
import { createId, targetPlatforms } from "./utils";
import { platformBadges } from "./constants";

interface TargetsEditorProps {
  open: boolean;
  targets: PlanTargets;
  onClose: () => void;
  onSave: (targets: PlanTargets) => void;
  onImport: (group: keyof PlanTargets) => void;
}

export const TargetsEditor: React.FC<TargetsEditorProps> = ({ open, targets, onClose, onSave, onImport }) => {
  const [activeTab, setActiveTab] = useState<keyof PlanTargets>("peers");
  const [localTargets, setLocalTargets] = useState<PlanTargets>(targets);

  useEffect(() => { setLocalTargets(targets); }, [targets]);

  const addTarget = (group: keyof PlanTargets) => {
    setLocalTargets((prev) => ({
      ...prev,
      [group]: [...prev[group], { id: createId(), handle: "", platform: "x" }],
    }));
  };

  const updateTarget = (group: keyof PlanTargets, id: string, update: Partial<Target>) => {
    setLocalTargets((prev) => ({
      ...prev,
      [group]: prev[group].map((target) => (target.id === id ? { ...target, ...update } : target)),
    }));
  };

  const removeTarget = (group: keyof PlanTargets, id: string) => {
    setLocalTargets((prev) => ({
      ...prev,
      [group]: prev[group].filter((target) => target.id !== id),
    }));
  };

  const groups: { key: keyof PlanTargets; label: string; helper: string }[] = [
    { key: "peers", label: "Peers", helper: "Creators at a similar stage" },
    { key: "prospects", label: "Prospects", helper: "Accounts likely to convert" },
    { key: "leaders", label: "Leaders", helper: "Signals and inspiration" },
  ];

  return (
    <Sheet open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <SheetContent position="left" size="xl">
        <SheetHeader>
          <SheetTitle>Curate targets</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => setActiveTab(group.key)}
                className={classNames(
                  "rounded-xl px-3 py-1.5 text-sm font-semibold",
                  activeTab === group.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {group.label} ({localTargets[group.key].length})
              </button>
            ))}
            <Tooltip content="Paste handles in bulk">
              <span>
                <Button color="minimal" size="sm" StartIcon={Download} onClick={() => onImport(activeTab)}>
                  Import
                </Button>
              </span>
            </Tooltip>
          </div>
          <div>
            <p className="text-sm text-slate-500">{groups.find((group) => group.key === activeTab)?.helper}</p>
          </div>
          <div className="space-y-3">
            {localTargets[activeTab].map((target) => (
              <div key={target.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center">
                <Input
                  value={target.handle}
                  placeholder="@handle or url"
                  onChange={(event) => updateTarget(activeTab, target.id, { handle: event.target.value })}
                  className="flex-1"
                />
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:w-48"
                  value={target.platform}
                  onChange={(event) => updateTarget(activeTab, target.id, { platform: event.target.value as TargetPlatform })}
                >
                  {targetPlatforms.map((platform) => (
                    <option key={platform} value={platform}>{platformBadges[platform].label}</option>
                  ))}
                </select>
                <Input
                  value={target.notes ?? ""}
                  placeholder="Notes"
                  onChange={(event) => updateTarget(activeTab, target.id, { notes: event.target.value })}
                  className="flex-1"
                />
                <Button variant="icon" color="minimal" size="sm" aria-label="Remove target" onClick={() => removeTarget(activeTab, target.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <Button color="minimal" onClick={() => addTarget(activeTab)} StartIcon={Plus}>Add target</Button>
          </div>
        </div>
        <SheetFooter className="mt-8 flex justify-end gap-2">
          <Button color="minimal" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(localTargets)}>Save targets</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

