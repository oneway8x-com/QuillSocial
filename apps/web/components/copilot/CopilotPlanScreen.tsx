import React, { useEffect, useMemo, useState } from "react";
import { Button, showToast } from "@quillsocial/ui";
import { Undo2 } from "@quillsocial/ui/components/icon";
import { COPILOT_PRESETS } from "./presets";
import {
  AudienceStage,
  CadenceDay,
  Plan,
  PlanBlockKey,
  PlanCadenceSlot,
  PlanPillar,
  PlanTargets,
  ToneOption,
  Target,
} from "./types";
import {
  dedupeTargets,
  detectCadenceConflicts,
  summarisePlan,
  validatePlan,
  COPILOT_DRAFT_STORAGE_KEY,
  buildDefaultPlan,
} from "./utils";
import { transformAIPlanToEnhancedPlan } from "@components/onboarding/aiPlanTransformer";
import { PurposeCard } from "./PurposeCard";
import { PlanPreview } from "./PlanPreview";
import { ApplyBar } from "./ApplyBar";
import { PillarEditor } from "./PillarEditor";
import { CadenceEditor } from "./CadenceEditor";
import { TargetsEditor } from "./TargetsEditor";
import { ImportTargetsDialog } from "./ImportTargetsDialog";
import { EngagementDialog } from "./EngagementDialog";
import { ConflictsReviewDialog } from "./ConflictsReviewDialog";
import { applyConflictResolutions } from "./conflictResolution";

interface DraftPayload {
  plan: Plan;
  purpose: string;
  tone: ToneOption;
  audienceStage: AudienceStage;
  selectedPresetId: string | null;
  savedAt: string;
}

const fastSleep = (duration = 500) => new Promise((resolve) => setTimeout(resolve, duration));

const CopilotPlanScreen: React.FC = () => {
  const [purpose, setPurpose] = useState<string>("");
  const [tone, setTone] = useState<ToneOption>("friendly");
  const [audienceStage, setAudienceStage] = useState<AudienceStage>("starting");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [expandedBlock, setExpandedBlock] = useState<PlanBlockKey | null>(null);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<PlanBlockKey, string>>>({});
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [draftMeta, setDraftMeta] = useState<string | null>(null);
  const [pillarsEditorOpen, setPillarsEditorOpen] = useState(false);
  const [cadenceEditorOpen, setCadenceEditorOpen] = useState(false);
  const [targetsEditorOpen, setTargetsEditorOpen] = useState(false);
  const [engagementDialogOpen, setEngagementDialogOpen] = useState(false);
  const [importTargetsOpen, setImportTargetsOpen] = useState(false);
  const [conflicts, setConflicts] = useState([] as ReturnType<typeof detectCadenceConflicts>);
  const [conflictsDialogOpen, setConflictsDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(COPILOT_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw) as DraftPayload;
      if (payload?.plan) {
        setShowRestoreBanner(true);
        setDraftMeta(payload.savedAt);
      }
    } catch (error) {
      console.error("Failed to parse copilot draft", error);
    }
  }, []);

  const summaryInfo = useMemo(() => (plan ? summarisePlan(plan) : null), [plan]);

  const disableGenerate = !purpose.trim() && !selectedPresetId;

  const hydrateFromDraft = () => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(COPILOT_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw) as DraftPayload;
      if (!payload.plan) return;
      setPurpose(payload.purpose);
      setTone(payload.tone);
      setAudienceStage(payload.audienceStage);
      setSelectedPresetId(payload.selectedPresetId);
      setPlan(payload.plan);
      setShowRestoreBanner(false);
      setHasUnsavedChanges(false);
      setValidationErrors({});
      setExpandedBlock("pillars");
      showToast("Draft restored", "success");
    } catch (error) {
      console.error("Unable to restore Copilot draft", error);
      showToast("Could not restore draft", "error");
    }
  };

  const clearDraftStorage = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(COPILOT_DRAFT_STORAGE_KEY);
    setDraftMeta(null);
  };

  const persistDraft = (currentPlan: Plan) => {
    if (typeof window === "undefined") return;
    setIsSavingDraft(true);
    const payload: DraftPayload = {
      plan: currentPlan,
      purpose,
      tone,
      audienceStage,
      selectedPresetId,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(COPILOT_DRAFT_STORAGE_KEY, JSON.stringify(payload));
    setTimeout(() => {
      setIsSavingDraft(false);
      setHasUnsavedChanges(false);
      setDraftMeta(payload.savedAt);
      showToast("Draft saved", "success");
    }, 200);
  };

  const handleGeneratePlan = async () => {
    if (disableGenerate) {
      showToast("Describe a purpose or choose a preset first", "error");
      return;
    }
    setIsGenerating(true);
    console.log("copilot_generate_clicked", { preset: selectedPresetId ?? undefined, tone, audienceStage });
    await fastSleep(450);

    const selectedPreset = COPILOT_PRESETS.find((preset) => preset.id === selectedPresetId);

    try {
      if (selectedPreset) {
        // Preset path (existing behavior)
        const generatedPlan = selectedPreset.buildPlan();
        generatedPlan.purpose = purpose.trim() || generatedPlan.purpose;
        generatedPlan.tone = tone;
        generatedPlan.audienceStage = audienceStage;
        setPlan(generatedPlan);
        setExpandedBlock("pillars");
        setValidationErrors({});
        setHasUnsavedChanges(true);
        console.log("copilot_plan_generated", {
          method: "preset",
          pillars: generatedPlan.pillars.length,
          slots: generatedPlan.cadence.length,
        });
      } else {
        // AI-powered generation path - call onboarding AI endpoint and transform result
        const selectedChannels = ["linkedin", "x"]; // default channels
        const response = await fetch("/api/onboarding/generate-ai-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal: purpose.trim(),
            persona: selectedPresetId || "indie creator",
            tone,
            channels: selectedChannels,
            audienceStage,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate AI plan");
        }

        const data = await response.json();
        // transform to EnhancedPlan
        const enhanced = transformAIPlanToEnhancedPlan(data.plan, tone, audienceStage);

        // Map EnhancedPlan to local Plan shape (Plan is subset of EnhancedPlan)
        const mappedPlan: Plan = {
          purpose: enhanced.purpose,
          tone: enhanced.tone,
          audienceStage: enhanced.audienceStage,
          pillars: enhanced.pillars,
          cadence: enhanced.cadence,
          targets: enhanced.targets,
          dailyReplies: enhanced.dailyReplies || 5,
        };

        setPlan(mappedPlan);
        setExpandedBlock("pillars");
        setValidationErrors({});
        setHasUnsavedChanges(true);
        console.log("copilot_plan_generated", {
          method: "ai",
          pillars: enhanced.pillars.length,
          slots: enhanced.cadence.length,
          week_slots: enhanced.week1Schedule?.length || 0,
        });
      }
    } catch (error) {
      console.error("Error generating plan (copilot):", error);
      showToast("Failed to generate plan", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUsePreset = () => {
    if (!selectedPresetId) {
      showToast("Select a preset to load", "error");
      return;
    }
    const preset = COPILOT_PRESETS.find((item) => item.id === selectedPresetId);
    if (!preset) return;
    const presetPlan = preset.buildPlan();
    presetPlan.tone = tone;
    presetPlan.audienceStage = audienceStage;
    presetPlan.purpose = purpose.trim() || presetPlan.purpose;
    setPlan(presetPlan);
    setExpandedBlock("pillars");
    setValidationErrors({});
    setHasUnsavedChanges(true);
    showToast(`${preset.label} preset applied. Review and apply when ready.`, "success");
  };

  const handleEditPillars = (updatedPillars: PlanPillar[]) => {
    setPlan((prev) => (prev ? { ...prev, pillars: updatedPillars } : prev));
    setHasUnsavedChanges(true);
    console.log("copilot_plan_edited", { block: "pillars" });
  };

  const handleEditCadence = (updatedCadence: PlanCadenceSlot[]) => {
    setPlan((prev) => (prev ? { ...prev, cadence: updatedCadence } : prev));
    setHasUnsavedChanges(true);
    console.log("copilot_plan_edited", { block: "cadence" });
  };

  const handleEditTargets = (updatedTargets: PlanTargets) => {
    setPlan((prev) => (prev ? { ...prev, targets: updatedTargets } : prev));
    setHasUnsavedChanges(true);
    console.log("copilot_plan_edited", { block: "targets" });
  };

  const handleEditEngagement = (value: number) => {
    setPlan((prev) => (prev ? { ...prev, dailyReplies: value } : prev));
    setHasUnsavedChanges(true);
    console.log("copilot_plan_edited", { block: "engagement" });
  };

  const handleSaveDraft = () => {
    if (!plan) return;
    persistDraft(plan);
  };

  const handleDiscard = () => {
    if (!plan) return;
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("Discard this plan? Unsaved edits will be lost.");
      if (!confirmed) return;
    }
    setPlan(null);
    setHasUnsavedChanges(false);
    setValidationErrors({});
    setExpandedBlock(null);
    showToast("Cleared plan preview", "success");
  };

  const handleApply = async () => {
    if (!plan) return;
    console.log("copilot_apply_clicked", { counts: summaryInfo ?? undefined, conflicts: 0 });
    const validation = validatePlan(plan);
    setValidationErrors(validation.errors);
    if (!validation.valid) {
      const firstError = Object.keys(validation.errors)[0] as PlanBlockKey | undefined;
      if (firstError) setExpandedBlock(firstError);
      showToast("Fix the highlighted blocks before applying.", "error");
      return;
    }

    const dedupedTargets = dedupeTargets(plan.targets);
    const planForApply = { ...plan, targets: dedupedTargets };

    const foundConflicts = detectCadenceConflicts(planForApply);
    if (foundConflicts.length > 0) {
      console.log("copilot_apply_conflicts", { count: foundConflicts.length });
      setConflicts(foundConflicts);
      setConflictsDialogOpen(true);
      return;
    }

    setIsApplying(true);
    await fastSleep(650);
    console.log("copilot_applied_success", {
      createdPlaceholders: planForApply.cadence.length * 4,
      upsertedTargets:
        planForApply.targets.peers.length +
        planForApply.targets.prospects.length +
        planForApply.targets.leaders.length,
    });
    showToast("Plan applied to workspace. Check Calendar & Engagement.", "success");
    setHasUnsavedChanges(false);
    clearDraftStorage();
    setIsApplying(false);
  };

  const handleResolveConflicts = (
    resolutions: Record<string, { action: "keep" | "merge" | "move"; moveDay?: CadenceDay }>
  ) => {
    if (!plan) return;
    const resolvedPlan = applyConflictResolutions(plan, conflicts, resolutions);
    setPlan(resolvedPlan);
    setConflicts([]);
    setConflictsDialogOpen(false);
    setHasUnsavedChanges(true);
    showToast("Conflicts updated. Review cadence and apply again.", "success");
  };

  const emptyState = !plan;

  return (
    <div className="flex flex-col gap-6 pb-24">
      {showRestoreBanner && draftMeta && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Undo2 size={16} />
            <span>
              Draft saved {new Date(draftMeta).toLocaleString()}. Restore it to keep editing.
            </span>
          </div>
          <div className="flex gap-2">
            <Button color="minimal" size="sm" onClick={() => { clearDraftStorage(); setShowRestoreBanner(false); }}>
              Dismiss
            </Button>
            <Button size="sm" onClick={hydrateFromDraft}>
              Restore draft
            </Button>
          </div>
        </div>
      )}

      {!plan && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-2 text-sm text-slate-600">
            <div className="text-base font-semibold text-slate-800">Copilot flow</div>
            <p>Describe your purpose, generate a plan, then apply pillars, cadence, and targets to your workspace in one click.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
        <PurposeCard
          purpose={purpose}
          onPurposeChange={setPurpose}
          tone={tone}
          onToneChange={setTone}
          audienceStage={audienceStage}
          onAudienceStageChange={setAudienceStage}
          selectedPresetId={selectedPresetId}
          onSelectPreset={setSelectedPresetId}
          onGeneratePlan={handleGeneratePlan}
          onUsePreset={handleUsePreset}
          disableGenerate={disableGenerate}
          isGenerating={isGenerating}
        />

        {plan && (
          <PlanPreview
            plan={plan}
            expandedBlock={expandedBlock}
            onToggleBlock={(block) => setExpandedBlock((current) => (current === block ? null : block))}
            onEditPillars={() => setPillarsEditorOpen(true)}
            onEditCadence={() => setCadenceEditorOpen(true)}
            onEditTargets={() => setTargetsEditorOpen(true)}
            onEditEngagement={() => setEngagementDialogOpen(true)}
            validationErrors={validationErrors}
          />
        )}
      </div>

      <ApplyBar
        visible={!emptyState}
        plan={plan}
        onApply={handleApply}
        onSaveDraft={handleSaveDraft}
        onDiscard={handleDiscard}
        disableApply={!plan}
        isApplying={isApplying}
        isSavingDraft={isSavingDraft}
        summaryLabel={summaryInfo?.label}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {plan && (
        <>
          <PillarEditor
            open={pillarsEditorOpen}
            pillars={plan.pillars}
            onClose={() => setPillarsEditorOpen(false)}
            onSave={handleEditPillars}
          />
          <CadenceEditor
            open={cadenceEditorOpen}
            cadence={plan.cadence}
            onClose={() => setCadenceEditorOpen(false)}
            onSave={handleEditCadence}
          />
          <TargetsEditor
            open={targetsEditorOpen}
            targets={plan.targets}
            onClose={() => setTargetsEditorOpen(false)}
            onSave={handleEditTargets}
            onImport={() => setImportTargetsOpen(true)}
          />
          <EngagementDialog
            open={engagementDialogOpen}
            current={plan.dailyReplies}
            onClose={() => setEngagementDialogOpen(false)}
            onSave={(value) => {
              handleEditEngagement(value);
              setEngagementDialogOpen(false);
            }}
          />
          <ImportTargetsDialog
            open={importTargetsOpen}
            onClose={() => setImportTargetsOpen(false)}
            onImport={(targets: Target[]) => {
              setPlan((prev) => {
                if (!prev) return prev;
                const mergedTargets: PlanTargets = {
                  ...prev.targets,
                  prospects: [...prev.targets.prospects, ...targets],
                };
                setHasUnsavedChanges(true);
                return { ...prev, targets: mergedTargets };
              });
              setImportTargetsOpen(false);
            }}
          />
          <ConflictsReviewDialog
            open={conflictsDialogOpen}
            conflicts={conflicts}
            onClose={() => setConflictsDialogOpen(false)}
            onResolve={handleResolveConflicts}
          />
        </>
      )}
    </div>
  );
};

export default CopilotPlanScreen;

