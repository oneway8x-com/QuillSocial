/**
 * Post Card - Individual post display with selection and preview
 */

import { useState } from "react";
import { Button, Badge, Checkbox } from "@quillsocial/ui";
import { ExternalLink, MessageSquare, Heart, ChevronDown, ChevronUp, X } from "lucide-react";
import { format } from "date-fns";

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
  isSelected: boolean;
  onToggle: (postId: string) => void;
  onSkip?: (postId: string) => void;
  template: string;
  topics: string[];
}

export default function PostCard({ post, isSelected, onToggle, onSkip, template, topics }: PostCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewText, setPreviewText] = useState("");

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

  return (
    <div
      className={`border-subtle relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all ${
        post.status !== "ACTIVE" ? "opacity-75" : ""
      } ${
        isSelected ? "ring-primary ring-2 ring-offset-2" : "hover:border-gray-400"
      }`}
    >
      {/* Checkbox - Only show for ACTIVE posts */}
      {post.status === "ACTIVE" && (
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          {onSkip && (
            <button
              onClick={handleSkip}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600 transition-all hover:bg-red-500/20 hover:scale-110"
              title="Skip this post"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(post.xPostId)}
            className="h-5 w-5 cursor-pointer rounded border-gray-300 text-primary transition-all hover:scale-110 focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
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
            {showPreview ? "Hide" : "Preview"} Comment
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
        </div>
      )}
    </div>
  );
}
