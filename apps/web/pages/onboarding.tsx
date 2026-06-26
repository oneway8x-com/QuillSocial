import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { ssrInit } from "@server/lib/ssr";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { trpc } from "@quillsocial/trpc/react";
import { showToast } from "@quillsocial/ui";
import PostHog from "@lib/analytics/posthog";
import { COPILOT_PRESETS } from "@components/copilot/presets";
import type { AudienceStage, Plan, EnhancedPlan, ToneOption } from "@components/copilot/types";
import { buildDefaultPlan, validatePlan } from "@components/copilot/utils";
import { enhancePlan } from "@components/onboarding/planGenerator";
import { transformAIPlanToEnhancedPlan } from "@components/onboarding/aiPlanTransformer";
import {
  OnboardingLayout,
  Step1PurposePlan,
  Step2FirstPost,
} from "@components/onboarding";
import Shell from "@quillsocial/features/shell/Shell";
import PageWrapper from "@components/PageWrapper";

function getTomorrowAtNine(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

type StepKey = 1 | 2;

function OnboardingPage() {
  const router = useRouter();
  const [user] = trpc.viewer.me.useSuspenseQuery();
  const utils = trpc.useContext();

  const [step, setStep] = useState<StepKey>(1);
  const startedAtRef = useRef<number>(Date.now());

  // Step 1 state (Plan Lite)
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState<ToneOption>("friendly");
  const [audienceStage, setAudienceStage] = useState<AudienceStage>("starting");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [plan, setPlan] = useState<EnhancedPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Step 2 state (Schedule)
  const [activeChannel, setActiveChannel] = useState<"linkedin" | "x" | "instagram" | "youtube" | "blog">("linkedin");
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Step 3 (Replies) removed/commented out
  // const [dailyGoal, setDailyGoal] = useState<number>(10);
  // const [repliesCount, setRepliesCount] = useState(0);
  // const [lastReplyCard, setLastReplyCard] = useState<string | null>(null);
  // const replyUndoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const completeOnboarding = trpc.viewer.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.viewer.me.refetch();
      const seconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      PostHog.capture("onb_complete", { timeToCompleteSec: seconds });
      router.push("/");
    },
  });

  // Initialize PostHog and capture view
  useEffect(() => {
    const enableRecordingEnv =
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_RECORD_ONBOARDING === "true") || false;
    PostHog.initPostHogOnce({ enableRecording: enableRecordingEnv });
    if (user?.id) {
      PostHog.identify(String(user.id), { email: user.email });
    }
    PostHog.capture("onb_viewed", { path: "/onboarding" });
  }, [user?.id, user?.email]);

  const handleGeneratePlan = async () => {
    if (!purpose.trim() && !selectedPresetId) {
      showToast("Describe a purpose or choose a preset first", "error");
      return;
    }
    setIsGenerating(true);
    PostHog.capture("onboarding_generate_plan_clicked", {
      preset: selectedPresetId ?? undefined,
      tone,
      audienceStage,
    });

    try {
      // Use AI generation when user provides a custom goal (not just selecting a preset)
      // Only fall back to preset logic when explicitly using a preset without custom text
      const shouldUsePreset = selectedPresetId && purpose.trim().length < 20;

      if (shouldUsePreset) {
        // Preset-based plan generation (legacy path for quick starts)
        const selectedPreset = COPILOT_PRESETS.find((p) => p.id === selectedPresetId);
        const basePlan = selectedPreset
          ? (() => {
              const p = selectedPreset.buildPlan();
              p.purpose = purpose.trim() || p.purpose;
              p.tone = tone;
              p.audienceStage = audienceStage;
              return p;
            })()
          : buildDefaultPlan(purpose, tone, audienceStage);

        // Enhance the plan with week-1 calendar, drafts, and engagement targets
        const enhancedPlan = enhancePlan(basePlan, user?.id);

        setPlan(enhancedPlan);
        setIsGenerating(false);

        // Telemetry
        PostHog.capture("plan_generated_success", {
          pillars_count: enhancedPlan.pillars.length,
          channels: enhancedPlan.cadence
            .flatMap((c) => c.channels)
            .filter((v, i, a) => a.indexOf(v) === i),
          week_slots: enhancedPlan.week1Schedule?.length || 0,
          method: "preset",
        });
      } else {
        // AI-powered plan generation (default path)
        const selectedChannels = ["linkedin", "x"]; // Default channels, can be made configurable

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
        const aiPlan = transformAIPlanToEnhancedPlan(data.plan, tone, audienceStage);

        setPlan(aiPlan);
        setIsGenerating(false);

        // Telemetry
        PostHog.capture("plan_generated_success", {
          pillars_count: aiPlan.pillars.length,
          channels: selectedChannels,
          week_slots: aiPlan.week1Schedule?.length || 0,
          method: "ai",
        });
      }

      // Mirror to server (metadata only) - for both AI and preset paths
      try {
        await fetch("/api/onboarding/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preset: selectedPresetId,
            tone,
            audienceStage,
            pillars_count: plan?.pillars.length || 0,
            slots_count: plan?.cadence.length || 0,
            week_slots: plan?.week1Schedule?.length || 0,
          }),
        });
      } catch (_) {
        // Silent fail for telemetry
      }
    } catch (error) {
      console.error("Error generating plan:", error);
      setIsGenerating(false);
      PostHog.capture("plan_generated_error", {
        code: "generation_failed",
        error: error instanceof Error ? error.message : "unknown",
      });
      showToast("Failed to generate plan", "error");
    }
  };

  const handleApplyPlan = async () => {
    if (!plan) return;
    const validation = validatePlan(plan);
    if (!validation.valid) {
      showToast("Fix plan validation issues before applying", "error");
      return;
    }
    setIsApplying(true);
    try {
      const resp = await fetch("/api/onboarding/apply-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.planId,
          pillars_count: plan.pillars.length,
          slots_count: plan.cadence.length,
          pillars: plan.pillars,
          purpose,
          tone,
          audienceStage,
          week1Schedule: plan.week1Schedule,
          engagementTargets: plan.engagementTargets,
          metrics: plan.metrics,
          byok: plan.byok,
        }),
      });
      const data = await resp.json();

      // Telemetry for plan application
      PostHog.capture("onb_plan_applied", {
        pillars_count: plan.pillars.length,
        slots_count: plan.cadence.length,
        drafts_created: plan.week1Schedule?.length || 0,
      });

      // Telemetry for advancing to next step
      PostHog.capture("onboarding_step_advanced", {
        to: "first_post",
      });

      // Telemetry for each draft created
      plan.week1Schedule?.forEach((slot) => {
        PostHog.capture("draft_created", {
          channel: slot.channel,
        });
      });

      showToast("Plan applied to workspace", "success");
      setStep(2);
    } catch (error) {
      console.error("Error applying plan:", error);
      showToast("Failed to apply plan", "error");
    } finally {
      setIsApplying(false);
    }
  };

  const scheduleForTomorrow = async () => {
    const when = getTomorrowAtNine();
    try {
      const resp = await fetch("/api/onboarding/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: activeChannel,
          whenISO: when.toISOString(),
          content: `My first post from QuillSocial onboarding! 🎉\n\nExcited to start sharing valuable content with my audience.`,
          idea: "First onboarding post"
        }),
      });
      const data = (await resp.json()) as { draftId?: string; postId?: number };
      setScheduledAt(when);
      setDraftId(data?.draftId || null);
      PostHog.capture("onb_post_scheduled", { channel: activeChannel, whenISO: when.toISOString(), postId: data?.postId });
      showToast(`Scheduled on ${activeChannel} for ${when.toLocaleString()}`, "success");
  // Auto-advance after brief delay to next step (no replies step)
  if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  undoTimerRef.current = setTimeout(() => setStep(2), 1200);
    } catch (_) {
      showToast("Failed to schedule", "error");
    }
  };

  const undoSchedule = () => {
    if (!scheduledAt) return;
    setScheduledAt(null);
    setDraftId(null);
    showToast("Undid schedule", "success");
  };

  // Reply/mock reply queue and handlers removed

  const statusLabel = useMemo(() => {
    const planReady = plan ? "Plan ready" : "No plan";
    const postStatus = scheduledAt ? "1 post scheduled" : "0 posts scheduled";
    return `${planReady} • ${postStatus}`;
  }, [plan, scheduledAt]);

  const getPrimaryAction = () => {
    if (step === 1) {
      return {
        label: plan
          ? isApplying
            ? "Applying…"
            : "Apply to Workspace"
          : isGenerating
          ? "Generating…"
          : "Generate Plan",
        onClick: plan ? handleApplyPlan : handleGeneratePlan,
        disabled: isGenerating || isApplying || (!purpose.trim() && !selectedPresetId && !plan),
        loading: isGenerating || isApplying,
      };
    }
    if (step === 2) {
      return {
        label: scheduledAt ? "Scheduled ✓" : "Schedule for Tomorrow 09:00",
        onClick: scheduleForTomorrow,
        disabled: !!scheduledAt,
      };
    }
    return {
      label: "Finish Onboarding",
      onClick: () => completeOnboarding.mutate({ completedOnboarding: true }),
      disabled: completeOnboarding.isLoading,
      loading: completeOnboarding.isLoading,
    };
  };

  const getSecondaryAction = () => {
    if (step === 2 && scheduledAt) {
      return {
        label: "Undo",
        onClick: undoSchedule,
      };
    }
    return undefined;
  };

  return (
    <Shell heading="" hideHeadingOnMobile withoutSeo>
      <OnboardingLayout
        currentStep={step}
        statusLabel={statusLabel}
        primaryAction={getPrimaryAction()}
        secondaryAction={getSecondaryAction()}
      >
        {step === 1 && (
          <Step1PurposePlan
            purpose={purpose}
            onPurposeChange={setPurpose}
            tone={tone}
            onToneChange={setTone}
            audienceStage={audienceStage}
            onAudienceStageChange={setAudienceStage}
            selectedPresetId={selectedPresetId}
            onSelectPreset={setSelectedPresetId}
            onGeneratePlan={handleGeneratePlan}
            isGenerating={isGenerating}
            plan={plan}
            onApplyPlan={handleApplyPlan}
            isApplying={isApplying}
          />
        )}

        {step === 2 && (
          <Step2FirstPost
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
            scheduledAt={scheduledAt}
            plan={plan}
          />
        )}

        {/* Step 3 (Replies) removed */}
      </OnboardingLayout>
    </Shell>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req, res, locale } = context;
  const session = await getServerSession({ req, res });
  if (!session?.user?.id) {
    return { redirect: { permanent: false, destination: "/auth/login" } };
  }
  const ssr = await ssrInit(context);
  await ssr.viewer.me.prefetch();
  return {
    props: {
      ...(await serverSideTranslations(locale || "", ["common"])),
      trpcState: ssr.dehydrate(),
    },
  };
}

OnboardingPage.PageWrapper = PageWrapper;

export default OnboardingPage;
