import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { trpc } from "@quillsocial/trpc/react";
import { Button, showToast } from "@quillsocial/ui";
import PostHog from "@lib/analytics/posthog";
import { COPILOT_PRESETS } from "@components/copilot/presets";
import type { AudienceStage, Plan, ToneOption } from "@components/copilot/types";
import { buildDefaultPlan, summarisePlan, validatePlan } from "@components/copilot/utils";
import { PurposeCard } from "@components/copilot/PurposeCard";
import { PlanPreview } from "@components/copilot/PlanPreview";

function getTomorrowAtNine(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

type StepKey = 1 | 2 | 3;

export default function OnboardingPage() {
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
  }, [user?.id]);

  const summary = useMemo(() => (plan ? summarisePlan(plan) : null), [plan]);

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
        body: JSON.stringify({ channel: activeChannel, whenISO: when.toISOString() }),
      });
      const data = (await resp.json()) as { draftId?: string };
      setScheduledAt(when);
      setDraftId(data?.draftId || null);
      PostHog.capture("onb_post_scheduled", { channel: activeChannel, whenISO: when.toISOString() });
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
      await fetch("/api/onboarding/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, cardId }),
      });
      PostHog.capture("onb_reply_sent", { platform, cardId });
      if (repliesCount + 1 >= 3) {
        showToast("Nice! 3 replies – you’re done.", "success");
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
    const postStatus = scheduledAt ? "1 post scheduled" : "1 post pending";
    const repliesStatus = `${repliesCount}/3 replies`;
    return `${planReady} • ${postStatus} • ${repliesStatus}`;
  }, [plan, scheduledAt, repliesCount]);

  const primaryCta = () => {
    if (step === 1) return (
      <Button onClick={plan ? handleApplyPlan : handleGeneratePlan} disabled={isGenerating || isApplying}>
        {plan ? (isApplying ? "Applying…" : "Apply to Workspace") : isGenerating ? "Generating…" : "Generate Plan"}
      </Button>
    );
    if (step === 2) return (
      <Button onClick={scheduleForTomorrow} disabled={!!scheduledAt}>
        {scheduledAt ? "Scheduled" : `Schedule for Tomorrow 09:00`}
      </Button>
    );
    return (
      <Button
        disabled={repliesCount < 3 || completeOnboarding.isLoading}
        onClick={() => completeOnboarding.mutate({ completedOnboarding: true })}
      >
        {repliesCount >= 3 ? "Finish" : "Send 3 Replies to Finish"}
      </Button>
    );
  };

  return (
    <div className="min-h-screen">
      <Head>
        <title>Onboarding – Quill</title>
      </Head>

      {/* Progress Header */}
      <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6 text-sm">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <div
                  className={`h-6 w-6 rounded-full text-center text-xs font-semibold leading-6 ${
                    step > (n as StepKey) ? "bg-green-500 text-white" : step === n ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {step > (n as StepKey) ? "✓" : n}
                </div>
                <span className={step === n ? "font-semibold" : "text-slate-500"}>
                  {n === 1 && "Purpose & Plan"}
                  {n === 2 && "First Post"}
                  {n === 3 && "First Replies"}
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500">Guided flow • ~5 min</div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-sm text-slate-700">
                <strong>Post smarter in 5 minutes.</strong> We’ll set a plan, schedule one post, and start your reply habit.
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
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
                onUsePreset={handleGeneratePlan}
                disableGenerate={!purpose.trim() && !selectedPresetId}
                isGenerating={isGenerating}
              />

              {plan && (
                <PlanPreview
                  plan={plan}
                  expandedBlock={null}
                  onToggleBlock={() => {}}
                  onEditPillars={() => {}}
                  onEditCadence={() => {}}
                  onEditTargets={() => {}}
                  onEditEngagement={() => {}}
                  validationErrors={{}}
                />
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-sm font-semibold text-slate-800">Quick Schedule</div>
              <div className="text-xs text-slate-600">We’ll schedule one post using the plan’s outline.</div>
            </div>
            <div className="flex gap-2">
              {[
                { id: "linkedin", label: "LinkedIn" },
                { id: "x", label: "X Thread" },
                { id: "instagram", label: "Carousel" },
                { id: "youtube", label: "Shorts" },
                { id: "blog", label: "Blog" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`rounded-md border px-3 py-1 text-sm ${
                    activeChannel === (tab.id as any)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => setActiveChannel(tab.id as any)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="rounded-xl border bg-white p-4 text-sm text-slate-700">
              <div className="mb-2 font-semibold">Outline Preview</div>
              <div className="text-slate-600">
                {plan ? (
                  <>
                    Based on your pillars ({plan.pillars.map((p) => p.name).slice(0, 3).join(", ")}
                    ...), we’ll draft a {activeChannel === "x" ? "thread" : "post"}.
                  </>
                ) : (
                  <>Safe default outline. You can refine after scheduling.</>
                )}
              </div>
              {scheduledAt && (
                <div className="mt-3 rounded-md bg-green-50 p-2 text-xs text-green-700">
                  Scheduled on {activeChannel} for {scheduledAt.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-sm font-semibold text-slate-800">Engagement Kickstart</div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-600">Daily goal:</div>
                <input
                  type="number"
                  className="w-20 rounded border p-1 text-sm"
                  value={dailyGoal}
                  min={1}
                  onChange={(e) => setDailyGoal(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {replyCards.map((c) => (
                <div key={c.id} className="rounded-xl border bg-white p-3 text-sm">
                  <div className="text-xs text-slate-500">{c.platform.toUpperCase()}</div>
                  <div className="mt-1 font-semibold text-slate-800">{c.author}</div>
                  <div className="mt-1 text-slate-700">{c.snippet}</div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => sendReply(c.id, c.platform)}>
                      Reply
                    </Button>
                    <Button size="sm" color="minimal">Quote-post</Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-slate-600">Progress: {repliesCount} / 3 replies</div>
          </div>
        )}
      </main>

      {/* Sticky Action Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="text-sm text-slate-600">{statusLabel}</div>
          <div className="flex items-center gap-3">
            {step === 2 && scheduledAt && (
              <Button color="minimal" size="sm" onClick={undoSchedule}>
                Undo (10s)
              </Button>
            )}
            {step === 3 && lastReplyCard && (
              <Button color="minimal" size="sm" onClick={undoLastReply}>
                Undo (10s)
              </Button>
            )}
            {primaryCta()}
          </div>
        </div>
      </div>
    </div>
  );
}

import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { ssrInit } from "@server/lib/ssr";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

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
