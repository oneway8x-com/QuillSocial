/**
 * Engage Modal - Confirmation before queuing engagement jobs
 */

import { useState } from "react";
import { trpc } from "@quillsocial/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  Button,
  showToast,
  Badge,
} from "@quillsocial/ui";
import { AlertCircle, Clock, Zap } from "lucide-react";

const DEFAULT_TEMPLATE = `Let's #connect if you're into:
🎨 Frontend • 💼 Backend • 👩‍💻 GenAI • ✨ Full-stack • 🧑‍💻 DevOps • ✅ DSA • 💻 LeetCode • 🧠 AI/ML • 🧱 Web3 • 📊 Data Science • 💸 Freelancing • 🐍 Python • 🔨 Startups

Hey {author}, loved your post! I'm building in public and would love to connect with folks into {topics}. #buildinpublic #letsconnect`;

interface EngageModalProps {
  open: boolean;
  onClose: () => void;
  selectedPostIds: string[];
  template: string;
  topics: string[];
  dailyMax: number;
  todayPosted: number;
  onSuccess: () => void;
}

export default function EngageModal({
  open,
  onClose,
  selectedPostIds,
  template,
  topics,
  dailyMax,
  todayPosted,
  onSuccess,
}: EngageModalProps) {
  const queueMutation = trpc.viewer.xConnect.queueEngagement.useMutation({
    onSuccess: (data) => {
      showToast(
        `Queued ${data.queued} jobs successfully! ${
          data.capped > 0 ? `${data.capped} capped due to limits.` : ""
        }`,
        "success"
      );
      onSuccess();
    },
    onError: (error) => {
      showToast(error.message, "error");
    },
  });

  const handleConfirm = () => {
    // Use default template if template is empty
    const finalTemplate = template && template.trim() !== "" ? template : DEFAULT_TEMPLATE;

    queueMutation.mutate({
      xPostIds: selectedPostIds,
      template: finalTemplate,
      topics,
    });
  };

  const remaining = dailyMax - todayPosted;
  const willQueue = Math.min(selectedPostIds.length, remaining);
  const willBeCapped = selectedPostIds.length - willQueue;
  const estimatedTime = Math.ceil((willQueue * 3) / 60); // 3 seconds per post, in minutes

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader
          title="Queue Engagement Jobs"
          subtitle="Confirm queuing comments for the selected posts. Jobs will be processed automatically with rate limiting."
        />

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="border-subtle rounded-lg border bg-muted/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-muted text-sm">Selected Posts</span>
              <Badge variant="blue">{selectedPostIds.length}</Badge>
            </div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-muted text-sm">Will Queue</span>
              <Badge variant="green">{willQueue}</Badge>
            </div>
            {willBeCapped > 0 && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted text-sm">Capped (Daily Limit)</span>
                <Badge variant="orange">{willBeCapped}</Badge>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4" />
                Estimated Time
              </span>
              <span className="text-foreground text-sm font-medium">~{estimatedTime} min</span>
            </div>
          </div>

          {/* Rate Info */}
          <div className="border-subtle flex items-start gap-3 rounded-lg border bg-blue-50 p-3 dark:bg-blue-950/20">
            <Zap className="text-blue-600 mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-foreground mb-1 font-medium">Rate Limiting Active</p>
              <p className="text-muted text-xs">
                Comments will be posted with 3-second spacing to respect X API limits (300 posts /
                3 hours). You'll receive notifications as each comment is posted.
              </p>
            </div>
          </div>

          {/* Budget Warning */}
          {todayPosted + willQueue >= dailyMax && (
            <div className="border-subtle flex items-start gap-3 rounded-lg border bg-orange-50 p-3 dark:bg-orange-950/20">
              <AlertCircle className="text-orange-600 mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-foreground mb-1 font-medium">Daily Limit Approaching</p>
                <p className="text-muted text-xs">
                  You're close to your daily max of {dailyMax} comments. Adjust in settings if
                  needed.
                </p>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="border-subtle rounded-lg border bg-muted/30 p-3">
            <p className="text-foreground mb-2 text-sm font-medium">After Queuing:</p>
            <ol className="text-muted space-y-1 text-xs">
              <li>1. Comments will be posted automatically over the next ~{estimatedTime} minutes</li>
              <li>2. You'll get notifications when each comment is posted</li>
              <li>3. Open X to manually follow/connect with engaged users</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button color="secondary" onClick={onClose} disabled={queueMutation.isLoading}>
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={handleConfirm}
            loading={queueMutation.isLoading}
            disabled={willQueue === 0}
          >
            Queue {willQueue} {willQueue === 1 ? "Job" : "Jobs"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
