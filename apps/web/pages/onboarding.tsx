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
import type { AudienceStage, Plan, ToneOption } from "@components/copilot/types";
import { buildDefaultPlan, validatePlan } from "@components/copilot/utils";
import {
  OnboardingLayout,
  Step1PurposePlan,
  Step2FirstPost,
  Step3FirstReplies,
} from "@components/onboarding";
import Shell from "@quillsocial/features/shell/Shell";
import PageWrapper from "@components/PageWrapper";

function getTomorrowAtNine(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

type StepKey = 1 | 2 | 3;

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
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Step 2 state (Schedule)
  const [activeChannel, setActiveChannel] = useState<"linkedin" | "x" | "instagram" | "youtube" | "blog">("linkedin");
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Step 3 state (Replies)
  const [dailyGoal, setDailyGoal] = useState<number>(10);
  const [repliesCount, setRepliesCount] = useState(0);
  const [lastReplyCard, setLastReplyCard] = useState<string | null>(null);
  const replyUndoTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    PostHog.capture("onb_generate_plan_clicked", {
      preset: selectedPresetId ?? undefined,
      tone,
      audienceStage,
    });

    const selectedPreset = COPILOT_PRESETS.find((p) => p.id === selectedPresetId);
    const generated = selectedPreset
      ? (() => {
          const p = selectedPreset.buildPlan();
          p.purpose = purpose.trim() || p.purpose;
          p.tone = tone; p.audienceStage = audienceStage; return p;
        })()
      : buildDefaultPlan(purpose, tone, audienceStage);

    setPlan(generated);
    setIsGenerating(false);
    // Mirror to server (metadata only)
    try {
      await fetch("/api/onboarding/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset: selectedPresetId,
          tone,
          audienceStage,
          pillars_count: generated.pillars.length,
          slots_count: generated.cadence.length,
        }),
      });
    } catch (_) {}
    PostHog.capture("onb_plan_generated", {
      pillars_count: generated.pillars.length,
      slots_count: generated.cadence.length,
    });
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
          pillars_count: plan.pillars.length,
          slots_count: plan.cadence.length,
          pillars: plan.pillars,
          purpose,
          tone,
          audienceStage,
        }),
      });
      const data = await resp.json();
      PostHog.capture("onb_plan_applied", {
        pillars_count: plan.pillars.length,
        slots_count: plan.cadence.length,
        placeholders_created: data?.placeholders_created ?? plan.cadence.length * 4,
      });
      showToast("Plan applied to workspace", "success");
      setStep(2);
    } catch (_) {
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
      // Auto-advance after brief delay
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => setStep(3), 1200);
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

  // Mock reply queue
  const replyCards = useMemo(
    () => [
      { id: "rx1", platform: "x", author: "@levelsio", snippet: "Launching a new micro SaaS weekly." },
      { id: "rx2", platform: "linkedin", author: "@revopsleaders", snippet: "Playbooks that actually convert." },
      { id: "rx3", platform: "x", author: "@productledge", snippet: "Make onboarding your growth loop." },
    ],
    []
  );

  const sendReply = async (cardId: string, platform: string) => {
    setRepliesCount((c) => c + 1);
    setLastReplyCard(cardId);
    try {
      const replyCard = replyCards.find(card => card.id === cardId);
      await fetch("/api/onboarding/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          cardId,
          replyContent: `Great insight! Thanks for sharing.`
        }),
      });
      PostHog.capture("onb_reply_sent", { platform, cardId, author: replyCard?.author });
      if (repliesCount + 1 >= 3) {
        showToast("Nice! 3 replies – you're done.", "success");
      }
      if (replyUndoTimerRef.current) clearTimeout(replyUndoTimerRef.current);
      replyUndoTimerRef.current = setTimeout(() => setLastReplyCard(null), 10000);
    } catch (_) {}
  };

    const undoLastReply = () => {
    if (!lastReplyCard) return;
    setRepliesCount((c) => Math.max(0, c - 1));
    setLastReplyCard(null);
    showToast("Reply undone", "success");
  };

  const statusLabel = useMemo(() => {
    const planReady = plan ? "Plan ready" : "No plan";
    const postStatus = scheduledAt ? "1 post scheduled" : "0 posts scheduled";
    const repliesStatus = `${repliesCount}/3 replies`;
    return `${planReady} • ${postStatus} • ${repliesStatus}`;
  }, [plan, scheduledAt, repliesCount]);

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
      label: repliesCount >= 3 ? "Finish Onboarding" : "Send 3 Replies to Finish",
      onClick: () => completeOnboarding.mutate({ completedOnboarding: true }),
      disabled: repliesCount < 3 || completeOnboarding.isLoading,
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
    if (step === 3 && lastReplyCard) {
      return {
        label: "Undo",
        onClick: undoLastReply,
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

        {step === 3 && (
          <Step3FirstReplies
            dailyGoal={dailyGoal}
            onDailyGoalChange={setDailyGoal}
            repliesCount={repliesCount}
            replyCards={replyCards}
            onSendReply={sendReply}
          />
        )}
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
