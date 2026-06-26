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
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          {steps.map(({ number, label }) => (
            <div key={number} className="flex items-center gap-2">
              <div
                className={classNames(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  currentStep > number
                    ? "bg-green-500 text-white shadow-sm"
                    : currentStep === number
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                {currentStep > number ? "✓" : number}
              </div>
              <span
                className={classNames(
                  "hidden text-sm transition-all sm:inline",
                  currentStep === number ? "font-semibold text-slate-900" : "text-slate-500"
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="hidden text-xs text-slate-500 sm:block">Guided flow • ~5 min</div>
      </div>
    </div>
  );
};
