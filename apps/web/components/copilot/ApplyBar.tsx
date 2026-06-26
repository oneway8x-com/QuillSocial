import React from "react";
import { Button, Badge } from "@quillsocial/ui";
import { AlertTriangle, CalendarDays, Loader2, Save, Trash2 } from "@quillsocial/ui/components/icon";
import { Plan } from "./types";

interface ApplyBarProps {
  visible: boolean;
  plan?: Plan | null;
  onApply: () => void;
  onSaveDraft: () => void;
  onDiscard: () => void;
  disableApply: boolean;
  isApplying: boolean;
  isSavingDraft: boolean;
  summaryLabel?: string;
  hasUnsavedChanges: boolean;
}

export const ApplyBar: React.FC<ApplyBarProps> = ({
  visible,
  plan,
  onApply,
  onDiscard,
  onSaveDraft,
  disableApply,
  isApplying,
  isSavingDraft,
  summaryLabel,
  hasUnsavedChanges,
}) => {
  if (!visible || !plan) return null;
  return (
    <div className="fixed bottom-4 left-0 right-0 z-30 px-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg shadow-slate-900/5 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 text-sm text-slate-600">
          <div className="font-semibold text-slate-800">Ready to apply?</div>
          <div>{summaryLabel}</div>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle size={14} /> Unsaved edits
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button color="minimal" onClick={onDiscard} StartIcon={Trash2}>
            Discard
          </Button>
          <Button color="secondary" onClick={onSaveDraft} StartIcon={isSavingDraft ? Loader2 : Save} disabled={isSavingDraft}>
            {isSavingDraft ? "Saving" : "Save as Draft"}
          </Button>
          <Button onClick={onApply} StartIcon={isApplying ? Loader2 : CalendarDays} disabled={disableApply || isApplying}>
            {isApplying ? "Applying" : "Apply to Workspace"}
          </Button>
        </div>
      </div>
    </div>
  );
};

