/**
 * Post Card - Individual post display with selection and preview
 */

import { useState } from "react";
import { Button, Badge, Checkbox, showToast, Dialog, DialogContent, DialogFooter, DialogHeader } from "@quillsocial/ui";
import { ExternalLink, MessageSquare, Heart, ChevronDown, ChevronUp, X, Send, Copy, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { trpc } from "@quillsocial/trpc/react";

interface PostCardProps {
  post: {
    id: string;
    xPostId: string;
    authorHandle: string;
    authorName?: string | null;
    authorIsFollowed: boolean;
    text: string;
    likeCount: number;
    replyCount: number;
    discoveredAt: Date;
    status: "ACTIVE" | "QUEUED" | "ENGAGED" | "SKIPPED";
  };
  onSkip?: (postId: string) => void;
  template: string;
  topics: string[];
  onStatusChange?: () => void;
}

export default function PostCard({ post, onSkip, template, topics, onStatusChange }: PostCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const [showEngageDialog, setShowEngageDialog] = useState(false);

  const commentMutation = trpc.viewer.xConnect.commentOnPost.useMutation({
    onSuccess: (data) => {
      showToast(data.message, "success");
      if (onStatusChange) onStatusChange();
    },
    onError: (error) => {
      showToast(error.message, "error");
      if (onStatusChange) onStatusChange();
    },
  });

  const markPostsMutation = trpc.viewer.xConnect.markPosts.useMutation({
    onSuccess: () => {
      showToast("Post moved to Engaged status", "success");
      setShowEngageDialog(false);
      if (onStatusChange) onStatusChange();
    },
    onError: (error) => {
      showToast(error.message, "error");
    },
  });

  const generatePreview = () => {
    let rendered = template || "Hey {author}, loved your post! Let's connect!";
    rendered = rendered.replace(/{author}/g, `@${post.authorHandle}`);
    if (topics.length > 0) {
      rendered = rendered.replace(/{topics}/g, topics.join(", "));
    }
    return rendered;
  };

  const handleTogglePreview = () => {
    if (!showPreview) {
      setPreviewText(generatePreview());
    }
    setShowPreview(!showPreview);
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSkip) {
      onSkip(post.xPostId);
    }
  };

  const handleComment = async () => {
    if (!previewText || previewText.trim() === "") {
      showToast("Comment cannot be empty", "error");
      return;
    }

    commentMutation.mutate({
      xPostId: post.xPostId,
      comment: previewText,
    });
  };

  const handleCopy = async () => {
    if (!previewText || previewText.trim() === "") {
      showToast("Comment cannot be empty", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(previewText);
      showToast("Comment copied to clipboard!", "success");
    } catch (error) {
      showToast("Failed to copy to clipboard", "error");
    }
  };

  const handleToEngage = () => {
    setShowEngageDialog(true);
  };

  const handleConfirmEngage = () => {
    markPostsMutation.mutate({
      xPostIds: [post.xPostId],
      status: "ENGAGED",
    });
  };

  return (
    <div
      className={`border-subtle relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all ${
        post.status !== "ACTIVE" ? "opacity-75" : ""
      } hover:border-gray-400`}
    >
      {/* Skip Button - Only show for ACTIVE posts */}
      {post.status === "ACTIVE" && onSkip && (
        <div className="absolute right-4 top-4 z-10">
          <button
            onClick={handleSkip}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600 transition-all hover:bg-red-500/20 hover:scale-110"
            title="Skip this post"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Author */}
      <div className="mb-3 flex items-start gap-3">
        <div className="bg-subtle flex h-10 w-10 items-center justify-center rounded-full">
          <span className="text-foreground text-sm font-semibold">
            {post.authorHandle[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-foreground text-sm font-semibold">@{post.authorHandle}</p>
            {post.authorIsFollowed ? (
              <Badge variant="gray">Followed</Badge>
            ) : (
              <Badge variant="green">Not Followed</Badge>
            )}
            {post.status === "QUEUED" && <Badge variant="orange">Queued</Badge>}
            {post.status === "ENGAGED" && <Badge variant="blue">Engaged</Badge>}
            {post.status === "SKIPPED" && <Badge variant="red">Skipped</Badge>}
          </div>
          {post.authorName && <p className="text-muted text-xs">{post.authorName}</p>}
        </div>
      </div>

      {/* Post Text */}
      <p className="text-foreground mb-3 text-sm leading-relaxed">
        {post.text.length > 200 ? post.text.substring(0, 200) + "..." : post.text}
      </p>

      {/* Metrics */}
      <div className="text-muted mb-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <Heart className="h-3 w-3" />
          {post.likeCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {post.replyCount}
        </span>
        <span className="ml-auto">{format(new Date(post.discoveredAt), "MMM d")}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        {post.status === "ACTIVE" && (
          <Button
            color="minimal"
            size="sm"
            onClick={handleTogglePreview}
            EndIcon={showPreview ? ChevronUp : ChevronDown}
          >
            {showPreview ? "Hide" : "Engage"} Comment
          </Button>
        )}
        <Button
          color="minimal"
          size="sm"
          href={`https://twitter.com/${post.authorHandle}/status/${post.xPostId}`}
          target="_blank"
          EndIcon={ExternalLink}
          className={post.status !== "ACTIVE" ? "ml-auto" : ""}
        >
          View on X
        </Button>
      </div>

      {/* Preview - Only for ACTIVE posts */}
      {post.status === "ACTIVE" && showPreview && (
        <div className="bg-muted mt-3 rounded-lg p-3">
          <p className="text-muted mb-1 text-xs font-medium">Preview:</p>
          <textarea
            className="text-foreground w-full resize-none border-0 bg-transparent text-sm focus:outline-none"
            rows={4}
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
          />

          {/* Action Buttons */}
          <div className="mt-3 flex gap-2">
            <Button
              color="primary"
              size="sm"
              StartIcon={Send}
              onClick={handleComment}
              loading={commentMutation.isLoading}
              disabled={!previewText || previewText.trim() === ""}
            >
              Comment
            </Button>
            <Button
              color="secondary"
              size="sm"
              StartIcon={Copy}
              onClick={handleCopy}
              disabled={!previewText || previewText.trim() === ""}
            >
              Copy
            </Button>
            <Button
              color="secondary"
              size="sm"
              StartIcon={UserPlus}
              onClick={handleToEngage}
            >
              To Engage
            </Button>
          </div>
        </div>
      )}

      {/* Engage Confirmation Dialog */}
      <Dialog open={showEngageDialog} onOpenChange={setShowEngageDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader
            title="Mark as Engaged?"
            subtitle="Reply on X with prefilled comment or copy manually."
          />
          <div className="space-y-3 py-3">
            {/* Twitter Intent Link */}
            <a
              href={`https://twitter.com/intent/tweet?in_reply_to=${post.xPostId}&text=${encodeURIComponent(previewText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-5 shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] group"
            >
              <div className="flex-1">
                <p className="text-white mb-1 text-lg font-bold flex items-center gap-2">
                  ✨ Reply on X (Recommended)
                </p>
                <p className="text-blue-50 text-sm">Opens X with prefilled comment. Edit before posting.</p>
              </div>
              <ExternalLink className="text-white ml-4 h-7 w-7 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Manual Instructions */}
            <div className="border-subtle rounded-xl border bg-muted/30 p-4">
              <p className="text-foreground mb-3 text-sm font-semibold">Or Copy & Paste Manually:</p>
              <ol className="text-muted space-y-2 text-sm">
                <li className="flex items-start gap-3">
                  <span className="bg-muted flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">1</span>
                  <span className="pt-0.5">Copy comment (use Copy button in preview)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-muted flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">2</span>
                  <span className="pt-0.5">Go to <a href={`https://twitter.com/${post.authorHandle}/status/${post.xPostId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">post on X</a></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-muted flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">3</span>
                  <span className="pt-0.5">Paste and post your comment</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-muted flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">4</span>
                  <span className="pt-0.5">Click "I've Commented" below</span>
                </li>
              </ol>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 pl-4 pr-3 py-3 rounded-lg">
              <p className="text-muted text-sm leading-relaxed">
                💡 <strong className="text-foreground">Tip:</strong> Clicking "I've Commented" confirms you replied and moves the post to Engaged.
                The post will be moved to your Engaged list.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              color="secondary"
              onClick={() => setShowEngageDialog(false)}
              disabled={markPostsMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleConfirmEngage}
              loading={markPostsMutation.isLoading}
            >
              I've Commented
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
