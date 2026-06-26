import React from "react";
import { Button } from "@quillsocial/ui";
import classNames from "@quillsocial/lib/classNames";
import { MessageCircle } from "@quillsocial/ui/components/icon";

interface ReplyCard {
  id: string;
  platform: string;
  author: string;
  snippet: string;
}

interface Step3FirstRepliesProps {
  dailyGoal: number;
  onDailyGoalChange: (goal: number) => void;
  repliesCount: number;
  replyCards: ReplyCard[];
  onSendReply: (cardId: string, platform: string) => void;
}

export const Step3FirstReplies: React.FC<Step3FirstRepliesProps> = ({
  dailyGoal,
  onDailyGoalChange,
  repliesCount,
  replyCards,
  onSendReply,
}) => {
  const progress = Math.min((repliesCount / 3) * 100, 100);
  const isComplete = repliesCount >= 3;

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 rounded-xl bg-purple-500 p-3">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Engagement Kickstart</h2>
            <p className="mt-1 text-sm text-slate-600">
              Build momentum by replying to relevant posts. Let's start with 3 replies to complete onboarding.
            </p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-slate-700">Daily goal:</label>
              <input
                type="number"
                className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={dailyGoal}
                min={1}
                onChange={(e) => onDailyGoalChange(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-900">Your Progress</span>
          <span className={classNames("font-semibold", isComplete ? "text-green-600" : "text-slate-700")}>
            {repliesCount} / 3 replies
          </span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={classNames(
              "h-full transition-all duration-500 ease-out",
              isComplete ? "bg-gradient-to-r from-green-400 to-green-500" : "bg-gradient-to-r from-blue-400 to-blue-600"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        {isComplete && (
          <p className="flex items-center gap-2 text-sm font-medium text-green-600">
            <span className="text-lg">✨</span>
            Great job! You've completed the engagement goal.
          </p>
        )}
      </div>

      {/* Reply Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {replyCards.map((card) => (
          <div
            key={card.id}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">
                {card.platform}
              </span>
            </div>
            <h4 className="mb-2 text-sm font-semibold text-slate-900">{card.author}</h4>
            <p className="mb-4 line-clamp-3 text-sm text-slate-600">{card.snippet}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onSendReply(card.id, card.platform)}
                className="flex-1 rounded-xl"
              >
                <MessageCircle size={14} className="mr-1" />
                Reply
              </Button>
              <Button size="sm" color="secondary" className="flex-1 rounded-xl">
                Quote
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Helpful Tips */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h4 className="mb-3 text-sm font-semibold text-slate-900">💡 Engagement Tips</h4>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• Add value to the conversation with thoughtful insights</li>
          <li>• Be authentic and share personal experiences</li>
          <li>• Ask questions to spark further discussion</li>
        </ul>
      </div>
    </div>
  );
};
