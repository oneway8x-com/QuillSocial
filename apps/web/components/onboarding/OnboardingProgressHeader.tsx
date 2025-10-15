import React from "react";
import classNames from "@quillsocial/lib/classNames";

type StepKey = 1 | 2 | 3;

interface OnboardingProgressHeaderProps {
  currentStep: StepKey;
}

const steps = [
  { number: 1, label: "Purpose & Plan" },
  { number: 2, label: "First Post" },
  { number: 3, label: "First Replies" },
] as const;

export const OnboardingProgressHeader: React.FC<OnboardingProgressHeaderProps> = ({ currentStep }) => {
  return (
    <div className="sticky top-0 z-20 border-b border-subtle bg-default/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          {steps.map(({ number, label }) => (
            <div key={number} className="flex items-center gap-2">
              <div
                className={classNames(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  currentStep > number
                    ? "bg-green-500 text-white shadow-sm"
                    : currentStep === number
                    ? "bg-brand-default text-brand-accent shadow-md"
                    : "bg-subtle text-muted"
                )}
              >
                {currentStep > number ? "✓" : number}
              </div>
              <span
                className={classNames(
                  "hidden text-sm transition-all sm:inline",
                  currentStep === number ? "font-semibold text-emphasis" : "text-subtle"
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="hidden text-xs text-muted sm:block">Guided flow • ~5 min</div>
      </div>
    </div>
  );
};
