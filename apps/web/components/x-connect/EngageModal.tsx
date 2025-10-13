/**
 * Engage Modal - Confirmation before queuing engagement jobs
 */

import { useState, useMemo } from "react";
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
import { AlertCircle, Clock, Zap, ExternalLink } from "lucide-react";

const DEFAULT_TEMPLATE = `Let's #connect if you're into:
🎨 Frontend • 💼 Backend • 👩‍💻 GenAI • ✨ Full-stack • 🧑‍💻 DevOps • ✅ DSA • 💻 LeetCode • 🧠 AI/ML • 🧱 Web3 • 📊 Data Science • 💸 Freelancing • 🐍 Python • 🔨 Startups

Hey {author}, loved your post! I'm building in public and would love to connect with folks into {topics}. #buildinpublic #letsconnect`;

interface Post {
  id: string;
  xPostId: string;
  authorHandle: string;
  authorName: string | null;
  text: string;
}

interface EngageModalProps {
  open: boolean;
  onClose: () => void;
  selectedPostIds: string[];
  selectedPosts: Post[];
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
  selectedPosts,
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

  // Helper to render template with tokens
  const renderTemplate = (tmpl: string, authorHandle: string) => {
    let rendered = tmpl.replace(/{author}/g, `@${authorHandle}`);
    if (topics.length > 0) {
      const topicsStr = topics.join(", ");
      rendered = rendered.replace(/{topics}/g, topicsStr);
    }
    return rendered;
  };

  // Generate Twitter intent links for each post
  const twitterIntentLinks = useMemo(() => {
    const finalTemplate = template && template.trim() !== "" ? template : DEFAULT_TEMPLATE;

    return selectedPosts.map(post => {
      const renderedComment = renderTemplate(finalTemplate, post.authorHandle);
      const encodedText = encodeURIComponent(renderedComment);
      return {
        postId: post.xPostId,
        authorHandle: post.authorHandle,
        url: `https://twitter.com/intent/tweet?in_reply_to=${post.xPostId}&text=${encodedText}`,
        comment: renderedComment,
      };
    });
  }, [selectedPosts, template, topics]);

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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader
          title="Queue Engagement Jobs"
          subtitle="Confirm queuing comments for the selected posts. You can also reply manually via X using the links below."
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

          {/* Twitter Intent Links */}
          {twitterIntentLinks.length > 0 && (
            <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-950/10 p-5">
              <h3 className="text-foreground mb-2 text-base font-bold flex items-center gap-2">
                ✨ Manual Reply Options
              </h3>
              <p className="text-muted mb-4 text-sm">
                Click any link below to open X with your prefilled comment. You can edit before posting.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {twitterIntentLinks.map((link, index) => (
                  <a
                    key={link.postId}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md p-4 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-semibold mb-1 flex items-center gap-1">
                        <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                        Reply to @{link.authorHandle}
                      </p>
                      <p className="text-muted text-xs truncate leading-relaxed">{link.comment}</p>
                    </div>
                    <div className="ml-3 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 p-2 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                      <ExternalLink className="text-blue-600 h-4 w-4" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

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
              <li>3. Or reply manually using the links above and edit as needed</li>
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
