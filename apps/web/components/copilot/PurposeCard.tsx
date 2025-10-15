import React from "react";
import { Button, Badge, TextArea } from "@quillsocial/ui";
import { Loader2, Wand2, Info } from "@quillsocial/ui/components/icon";
import classNames from "classnames";
import { AudienceStage, ToneOption } from "./types";
import { COPILOT_PRESETS } from "./presets";

interface PurposeCardProps {
  purpose: string;
  onPurposeChange: (value: string) => void;
  tone: ToneOption;
  onToneChange: (tone: ToneOption) => void;
  audienceStage: AudienceStage;
  onAudienceStageChange: (stage: AudienceStage) => void;
  selectedPresetId: string | null;
  onSelectPreset: (presetId: string) => void;
  onGeneratePlan: () => void;
  onUsePreset: () => void;
  disableGenerate: boolean;
  isGenerating: boolean;
}

export const PurposeCard: React.FC<PurposeCardProps> = ({
  purpose,
  onPurposeChange,
  tone,
  onToneChange,
  audienceStage,
  onAudienceStageChange,
  selectedPresetId,
  onSelectPreset,
  onGeneratePlan,
  onUsePreset,
  disableGenerate,
  isGenerating,
}) => {
  const toneOptions: { key: ToneOption; label: string }[] = [
    { key: "friendly", label: "Friendly" },
    { key: "authoritative", label: "Authoritative" },
    { key: "contrarian", label: "Contrarian" },
  ];

  const audienceOptions: { key: AudienceStage; label: string }[] = [
    { key: "starting", label: "Starting" },
    { key: "small", label: "Small" },
    { key: "growing", label: "Growing" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900">Purpose</h2>
          <p className="mt-1 text-sm text-slate-600">
            Describe what you want to achieve. Copilot will translate it into pillars, cadence, and reach targets.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onGeneratePlan}
          StartIcon={isGenerating ? Loader2 : Wand2}
          disabled={disableGenerate || isGenerating}
          className="shrink-0 rounded-xl"
        >
          {isGenerating ? "Generating" : "Generate Plan"}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="copilot-purpose">
            Describe what you want to achieve
          </label>
          <TextArea
            id="copilot-purpose"
            value={purpose}
            onChange={(event) => onPurposeChange(event.target.value)}
            rows={5}
            placeholder="e.g. Launch a contrarian SaaS voice that attracts senior operators"
            className="min-h-[140px] rounded-xl border-slate-200"
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Preset personas</label>
            <div className="flex flex-wrap gap-2">
              {COPILOT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  className={classNames(
                    "rounded-full px-4 py-1.5 text-sm font-medium",
                    selectedPresetId === preset.id
                      ? "bg-blue-500 text-white"
                      : "bg-blue-50 text-blue-700"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Tone</label>
            <div className="flex gap-2">
              {toneOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onToneChange(option.key)}
                  className={classNames(
                    "px-3 py-1.5 rounded-xl text-sm font-medium",
                    tone === option.key
                      ? "bg-blue-500 text-white"
                      : "bg-blue-50 text-blue-700"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Audience size</label>
            <div className="flex gap-2">
              {audienceOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onAudienceStageChange(option.key)}
                  className={classNames(
                    "px-3 py-1.5 rounded-xl text-sm font-medium",
                    audienceStage === option.key
                      ? "bg-blue-500 text-white"
                      : "bg-blue-50 text-blue-700"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm text-slate-600">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span>Using a preset keeps defaults but still lets you edit before applying.</span>
        </div>
        <Button
          color="secondary"
          onClick={onUsePreset}
          disabled={!selectedPresetId}
          className="shrink-0 sm:ml-4 rounded-xl"
        >
          Use Preset
        </Button>
      </div>
    </div>
  );
};
