import React from "react";
import classNames from "@quillsocial/lib/classNames";
import type { Plan } from "@components/copilot/types";
import { CheckCircle2 } from "@quillsocial/ui/components/icon";

type Channel = "linkedin" | "x" | "instagram" | "youtube" | "blog";

interface ChannelOption {
  id: Channel;
  label: string;
  icon: string;
}

interface Step2FirstPostProps {
  activeChannel: Channel;
  onChannelChange: (channel: Channel) => void;
  scheduledAt: Date | null;
  plan: Plan | null;
}

const channelOptions: ChannelOption[] = [
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "x", label: "X Thread", icon: "𝕏" },
  { id: "instagram", label: "Carousel", icon: "📸" },
  { id: "youtube", label: "Shorts", icon: "📹" },
  { id: "blog", label: "Blog", icon: "✍️" },
];

export const Step2FirstPost: React.FC<Step2FirstPostProps> = ({
  activeChannel,
  onChannelChange,
  scheduledAt,
  plan,
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header Card */}
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Quick Schedule</h2>
            <p className="mt-1 text-sm text-slate-600">
              Choose a platform and we'll schedule your first post using the plan's outline.
            </p>
          </div>
        </div>
      </div>

      {/* Channel Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">Select Platform</label>
        <div className="flex flex-wrap gap-3">
          {channelOptions.map((channel) => (
            <button
              key={channel.id}
              className={classNames(
                "group flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                activeChannel === channel.id
                  ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
              )}
              onClick={() => onChannelChange(channel.id)}
            >
              <span className="text-lg">{channel.icon}</span>
              <span>{channel.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Outline Preview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Outline Preview</h3>
          {scheduledAt && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 size={16} className="text-green-500" />
              <span>Scheduled</span>
            </div>
          )}
        </div>
        <div className="text-sm text-slate-600">
          {plan ? (
            <div className="space-y-2">
              <p>
                Based on your pillars:{" "}
                <span className="font-medium text-slate-900">
                  {plan.pillars.map((p) => p.name).slice(0, 3).join(", ")}
                  {plan.pillars.length > 3 && "..."}
                </span>
              </p>
              <p className="text-slate-500">
                We'll draft a {activeChannel === "x" ? "thread" : "post"} that aligns with your content strategy.
              </p>
            </div>
          ) : (
            <p className="text-slate-500">
              Using a safe default outline. You can refine the content after scheduling.
            </p>
          )}
        </div>

        {scheduledAt && (
          <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-3 text-sm">{" "}
            <p className="font-medium text-green-900">
              ✓ Scheduled on {activeChannel} for {scheduledAt.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
