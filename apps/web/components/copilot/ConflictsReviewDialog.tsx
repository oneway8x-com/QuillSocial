import React, { useState } from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader } from "@quillsocial/ui";
import classNames from "classnames";
import { CadenceDay } from "./types";
import { cadenceDays } from "./utils";
import type { CadenceConflict } from "./utils";

interface ConflictsReviewDialogProps {
  open: boolean;
  conflicts: CadenceConflict[];
  onClose: () => void;
  onResolve: (resolutions: Record<string, { action: "keep" | "merge" | "move"; moveDay?: CadenceDay }>) => void;
}

export const ConflictsReviewDialog: React.FC<ConflictsReviewDialogProps> = ({ open, conflicts, onClose, onResolve }) => {
  const [resolutions, setResolutions] = useState<Record<string, { action: "keep" | "merge" | "move"; moveDay?: CadenceDay }>>({});

  const handleActionChange = (conflictId: string, action: "keep" | "merge" | "move") => {
    setResolutions((prev) => ({ ...prev, [conflictId]: { action } }));
  };

  const handleMoveDay = (conflictId: string, day: CadenceDay) => {
    setResolutions((prev) => ({ ...prev, [conflictId]: { ...(prev[conflictId] ?? { action: "move" }), moveDay: day } }));
  };

  const actionLabel: Record<"keep" | "merge" | "move", string> = { keep: "Keep both", merge: "Merge channels", move: "Move one" };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader title="Resolve cadence conflicts" />
        <div className="space-y-4 text-sm text-slate-600">
          <p>We found overlapping slots. Choose how to handle them.</p>
          <div className="space-y-3">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 text-sm font-semibold text-slate-700">{conflict.day} • {conflict.slots.length} overlapping</div>
                <div className="space-y-2">
                  {(["merge", "keep", "move"] as const).map((action) => (
                    <label key={action} className="flex items-center gap-2 text-sm">
                      <input type="radio" name={`conflict-${conflict.id}`} className="accent-blue-600" checked={(resolutions[conflict.id]?.action ?? "merge") === action} onChange={() => handleActionChange(conflict.id, action)} />
                      {actionLabel[action]}
                    </label>
                  ))}
                  {resolutions[conflict.id]?.action === "move" && (
                    <div className="ml-6 flex flex-wrap gap-2">
                      {cadenceDays.map((day) => (
                        <button
                          key={day}
                          type="button"
                          className={classNames(
                            "rounded-xl px-3 py-1 text-xs font-semibold",
                            resolutions[conflict.id]?.moveDay === day ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"
                          )}
                          onClick={() => handleMoveDay(conflict.id, day)}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button color="minimal" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onResolve(resolutions)}>Resolve conflicts</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
