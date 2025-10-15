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
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-subtle bg-default/95 backdrop-blur-md shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="text-sm text-default">{statusLabel}</div>
        <div className="flex items-center gap-3">
          {secondaryAction && (
            <Button color="minimal" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          <Button
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            loading={primaryAction.loading}
          >
            {primaryAction.label}
          </Button>
        </div>
      </div>
    </div>
  );
};
