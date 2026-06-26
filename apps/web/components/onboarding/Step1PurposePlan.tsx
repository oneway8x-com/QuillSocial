import React from "react";
import type { AudienceStage, EnhancedPlan, ToneOption } from "@components/copilot/types";
import { PurposeCard } from "@components/copilot/PurposeCard";
import { PlanReview } from "./PlanReview";

interface Step1PurposePlanProps {
  purpose: string;
  onPurposeChange: (value: string) => void;
  tone: ToneOption;
  onToneChange: (tone: ToneOption) => void;
  audienceStage: AudienceStage;
  onAudienceStageChange: (stage: AudienceStage) => void;
  selectedPresetId: string | null;
  onSelectPreset: (presetId: string) => void;
  onGeneratePlan: () => void;
  isGenerating: boolean;
  plan: EnhancedPlan | null;
  onApplyPlan?: () => void;
  isApplying?: boolean;
}

export const Step1PurposePlan: React.FC<Step1PurposePlanProps> = ({
  purpose,
  onPurposeChange,
  tone,
  onToneChange,
  audienceStage,
  onAudienceStageChange,
  selectedPresetId,
  onSelectPreset,
  onGeneratePlan,
  isGenerating,
  plan,
  onApplyPlan,
  isApplying = false,
}) => {
  const handleEditPlan = () => {
    // For now, just scroll to top to edit
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 rounded-xl bg-blue-500 p-3">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Post smarter in 5 minutes</h2>
            <p className="mt-1 text-sm text-slate-600">
              We'll set a plan, schedule one post, and start your reply habit. Let's begin by defining your purpose.
            </p>
          </div>
        </div>
      </div>

      {/* Purpose Card and Plan Preview Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PurposeCard
          purpose={purpose}
          onPurposeChange={onPurposeChange}
          tone={tone}
          onToneChange={onToneChange}
          audienceStage={audienceStage}
          onAudienceStageChange={onAudienceStageChange}
          selectedPresetId={selectedPresetId}
          onSelectPreset={onSelectPreset}
          onGeneratePlan={onGeneratePlan}
          onUsePreset={onGeneratePlan}
          disableGenerate={!purpose.trim() && !selectedPresetId}
          isGenerating={isGenerating}
        />

        {plan && (
          <div className="animate-fade-in-up">
            <PlanReview
              plan={plan}
              onUsePlan={onApplyPlan || (() => {})}
              onEditPlan={handleEditPlan}
              isApplying={isApplying}
            />
          </div>
        )}
      </div>
    </div>
  );
};
