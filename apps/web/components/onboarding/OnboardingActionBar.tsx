import React, { ReactNode } from "react";
import { Button } from "@quillsocial/ui";

interface OnboardingActionBarProps {
  statusLabel: string;
  primaryAction: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const OnboardingActionBar: React.FC<OnboardingActionBarProps> = ({
  statusLabel,
  primaryAction,
  secondaryAction,
}) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="text-sm text-slate-600">{statusLabel}</div>
        <div className="flex items-center gap-3">
          {secondaryAction && (
            <Button color="minimal" size="sm" onClick={secondaryAction.onClick} className="rounded-xl">
              {secondaryAction.label}
            </Button>
          )}
          <Button
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            loading={primaryAction.loading}
            className="rounded-xl"
          >
            {primaryAction.label}
          </Button>
        </div>
      </div>
    </div>
  );
};
