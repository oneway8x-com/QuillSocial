import React from "react";
import type { EnhancedPlan } from "@components/copilot/types";
import { Button, Badge } from "@quillsocial/ui";
import { Calendar, Target, TrendingUp, AlertCircle } from "@quillsocial/ui/components/icon";
import PostHog from "@lib/analytics/posthog";

interface PlanReviewProps {
  plan: EnhancedPlan;
  onUsePlan: () => void;
  onEditPlan: () => void;
  isApplying: boolean;
}

export const PlanReview: React.FC<PlanReviewProps> = ({
  plan,
  onUsePlan,
  onEditPlan,
  isApplying,
}) => {
  const handleUsePlanClick = () => {
    PostHog.capture("cta_clicked", {
      cta: "use_plan",
    });
    onUsePlan();
  };

  const handleEditPlanClick = () => {
    PostHog.capture("cta_clicked", {
      cta: "edit_plan",
    });
    onEditPlan();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* BYOK Banner */}
      {!plan.byok?.xConnected && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Connect X to unlock engagement lists
              </p>
              <p className="mt-1 text-sm text-blue-700">
                Connect your X account to fetch real posts from your engagement engine. For now, we've
                created placeholder targets.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          onClick={handleUsePlanClick}
          disabled={isApplying}
          loading={isApplying}
          className="flex-1 rounded-xl"
        >
          {isApplying ? "Applying Plan..." : "Use This Plan → Create First Post"}
        </Button>
        <Button
          size="lg"
          variant="button"
          color="secondary"
          onClick={handleEditPlanClick}
          disabled={isApplying}
          className="rounded-xl"
        >
          Edit Plan
        </Button>
      </div>

      {/* Plan Summary Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Pillars */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Content Pillars</h3>
          </div>
          <div className="space-y-2">
            {plan.pillars.map((pillar) => (
              <div key={pillar.id} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: pillar.color }}
                />
                <span className="text-sm text-slate-700">{pillar.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cadence */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Weekly Cadence</h3>
          </div>
          <div className="space-y-2">
            {plan.cadence.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{slot.day}</span>
                <div className="flex gap-1">
                  {slot.channels.map((ch) => (
                    <Badge key={ch} variant="gray" className="text-xs">
                      {ch}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Momentum Metrics</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Posts/week</span>
              <span className="font-semibold text-slate-900">
                {plan.metrics?.weeklyPostTarget || 5}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Replies/day</span>
              <span className="font-semibold text-slate-900">
                {plan.metrics?.dailyReplyTarget || 5}
              </span>
            </div>
            {/* <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Engage with</span>
              <span className="font-semibold text-slate-900">
                {plan.engagementTargets?.personas.join(", ")}
              </span>
            </div> */}
          </div>
        </div>
      </div>

      {/* Week 1 Schedule */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">Week 1 Schedule</h3>
          <p className="mt-1 text-sm text-slate-600">
            {plan.week1Schedule?.length || 0} posts ready to draft
          </p>
        </div>
        <div className="space-y-4">
          {plan.week1Schedule?.map((slot, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="blue" className="text-xs">
                    {slot.channel}
                  </Badge>
                  <span className="text-sm text-slate-600">{formatDate(slot.date)}</span>
                </div>
              </div>
              <h4 className="font-medium text-slate-900 mb-2">{slot.draft.title}</h4>
              <p className="text-sm text-slate-600 mb-2">{slot.draft.hook}</p>
              <div className="space-y-1 text-xs text-slate-500">
                {slot.draft.outline.slice(0, 2).map((line, i) => (
                  <div key={i}>• {line}</div>
                ))}
                {slot.draft.outline.length > 2 && (
                  <div className="text-slate-400">
                    + {slot.draft.outline.length - 2} more points
                  </div>
                )}
              </div>
              {slot.draft.hashtags && slot.draft.hashtags.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {slot.draft.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-blue-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <details className="mt-3">
                <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-900">
                  View reply kit ({slot.draft.replies.length} suggestions)
                </summary>
                <div className="mt-2 space-y-1 pl-4 border-l-2 border-slate-200">
                  {slot.draft.replies.map((reply, i) => (
                    <div key={i} className="text-xs text-slate-600">
                      {i + 1}. {reply}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTAs (repeat for convenience) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          onClick={handleUsePlanClick}
          disabled={isApplying}
          loading={isApplying}
          className="flex-1 rounded-xl"
        >
          {isApplying ? "Applying Plan..." : "Use This Plan → Create First Post"}
        </Button>
        <Button
          size="lg"
          variant="button"
          color="secondary"
          onClick={handleEditPlanClick}
          disabled={isApplying}
          className="rounded-xl"
        >
          Edit Plan
        </Button>
      </div>
    </div>
  );
};
