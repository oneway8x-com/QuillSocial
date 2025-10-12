/**
 * Settings Sheet Component
 * Configure X Connect Engagement settings
 */

import { useState, useEffect } from "react";
import { trpc } from "@quillsocial/trpc/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Button,
  TextField,
  Label,
  Switch,
  showToast,
  Badge,
} from "@quillsocial/ui";
import { X, Plus } from "lucide-react";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  settings?: any;
  onSave: () => void;
}

const DEFAULT_TOPICS = [
  "Frontend",
  "Backend",
  "GenAI",
  "Full-stack",
  "DevOps",
  "DSA",
  "LeetCode",
  "AI/ML",
  "Web3",
  "Data Science",
  "Freelancing",
  "Python",
  "Startup",
];

export default function SettingsSheet({ open, onClose, settings, onSave }: SettingsSheetProps) {
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [language, setLanguage] = useState("");
  const [minLikes, setMinLikes] = useState<number | undefined>();
  const [minReplies, setMinReplies] = useState<number | undefined>();
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [excludeFollowed, setExcludeFollowed] = useState(true);
  const [dailyMaxComments, setDailyMaxComments] = useState(20);
  const [rateSpacingMs, setRateSpacingMs] = useState(3000);
  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [topicInput, setTopicInput] = useState("");
  const [maxReadsPerScan, setMaxReadsPerScan] = useState(20);

  const saveSettingsMutation = trpc.viewer.xConnect.saveSettings.useMutation({
    onSuccess: () => {
      showToast("Settings saved successfully", "success");
      onSave();
      onClose();
    },
    onError: (error) => {
      showToast(error.message, "error");
    },
  });

  // Load settings when opened
  useEffect(() => {
    if (settings) {
      setHashtags(settings.hashtags || []);
      setLanguage(settings.language || "");
      setMinLikes(settings.minLikes);
      setMinReplies(settings.minReplies);
      setExcludeKeywords(settings.excludeKeywords || []);
      setExcludeFollowed(settings.excludeFollowed ?? true);
      setDailyMaxComments(settings.dailyMaxComments || 20);
      setRateSpacingMs(settings.rateSpacingMs || 3000);
      setTopics(settings.topics || DEFAULT_TOPICS);
      setMaxReadsPerScan(settings.maxReadsPerScan || 20);
    }
  }, [settings, open]);

  const handleAddHashtag = () => {
    if (hashtagInput && !hashtags.includes(hashtagInput)) {
      setHashtags([...hashtags, hashtagInput.replace(/^#/, "")]);
      setHashtagInput("");
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handleAddKeyword = () => {
    if (keywordInput && !excludeKeywords.includes(keywordInput)) {
      setExcludeKeywords([...excludeKeywords, keywordInput]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setExcludeKeywords(excludeKeywords.filter((k) => k !== keyword));
  };

  const handleAddTopic = () => {
    if (topicInput && !topics.includes(topicInput)) {
      setTopics([...topics, topicInput]);
      setTopicInput("");
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter((t) => t !== topic));
  };

  const handleSave = () => {
    saveSettingsMutation.mutate({
      hashtags,
      language: language || undefined,
      minLikes: minLikes ?? undefined,
      minReplies: minReplies ?? undefined,
      excludeKeywords,
      excludeFollowed,
      dailyMaxComments,
      rateSpacingMs,
      topics,
      maxReadsPerScan,
      monthlyReadCap: 100,
      monthlyPostCap: 500,
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent position="right" size="lg" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Connect Engagement Settings</SheetTitle>
          <SheetDescription>
            Configure hashtags, filters, and rate limits for discovering posts.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Hashtags */}
          <div>
            <Label htmlFor="hashtags" className="text-base font-semibold">
              Hashtags to Monitor
            </Label>
            <div className="mt-2 flex gap-2">
              <TextField
                id="hashtags"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddHashtag();
                  }
                }}
                placeholder="connect, letsconnect..."
                className="flex-1"
              />
              <Button
                type="button"
                color="secondary"
                onClick={handleAddHashtag}
                className="shrink-0"
                StartIcon={Plus}
              >
                Add
              </Button>
            </div>
            {hashtags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <Badge key={tag} variant="gray" className="text-sm">
                    #{tag}
                    <button
                      onClick={() => handleRemoveHashtag(tag)}
                      className="ml-1.5 hover:text-red-600"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Language */}
          <div>
            <Label htmlFor="language" className="text-base font-semibold">
              Language Filter (optional)
            </Label>
            <TextField
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="en"
              className="mt-2"
            />
            <p className="text-muted mt-1 text-xs">Use language code (e.g., en, es, fr)</p>
          </div>

          {/* Min Likes/Replies */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="minLikes" className="text-base font-semibold">
                Min Likes
              </Label>
              <TextField
                id="minLikes"
                type="number"
                value={minLikes || ""}
                onChange={(e) => setMinLikes(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="0"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="minReplies" className="text-base font-semibold">
                Min Replies
              </Label>
              <TextField
                id="minReplies"
                type="number"
                value={minReplies || ""}
                onChange={(e) =>
                  setMinReplies(e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder="0"
                className="mt-2"
              />
            </div>
          </div>

          {/* Exclude Keywords */}
          <div>
            <Label htmlFor="excludeKeywords" className="text-base font-semibold">
              Exclude Keywords
            </Label>
            <div className="mt-2 flex gap-2">
              <TextField
                id="excludeKeywords"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                placeholder="spam, promo..."
                className="flex-1"
              />
              <Button
                type="button"
                color="secondary"
                onClick={handleAddKeyword}
                className="shrink-0"
                StartIcon={Plus}
              >
                Add
              </Button>
            </div>
            {excludeKeywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {excludeKeywords.map((keyword) => (
                  <Badge key={keyword} variant="gray" className="text-sm">
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-1.5 hover:text-red-600"
                      aria-label={`Remove ${keyword}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Topics for template */}
          <div>
            <Label htmlFor="topics" className="text-base font-semibold">
              Topics (for template)
            </Label>
            <div className="mt-2 flex gap-2">
              <TextField
                id="topics"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                placeholder="Frontend, AI/ML..."
                className="flex-1"
              />
              <Button
                type="button"
                color="secondary"
                onClick={handleAddTopic}
                className="shrink-0"
                StartIcon={Plus}
              >
                Add
              </Button>
            </div>
            {topics.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <Badge key={topic} variant="blue" className="text-sm">
                    {topic}
                    <button
                      onClick={() => handleRemoveTopic(topic)}
                      className="ml-1.5 hover:text-red-600"
                      aria-label={`Remove ${topic}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Exclude Followed */}
          <div className="border-subtle flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="flex-1">
              <Label className="text-base font-semibold">Exclude authors you already follow</Label>
              <p className="text-muted mt-1 text-sm">Skip posts from accounts you're following</p>
            </div>
            <Switch checked={excludeFollowed} onCheckedChange={setExcludeFollowed} />
          </div>

          {/* Rate Limits */}
          <div>
            <Label className="mb-3 text-base font-semibold">Rate Limits</Label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="dailyMax" className="text-sm">
                  Daily Max Comments
                </Label>
                <TextField
                  id="dailyMax"
                  type="number"
                  value={dailyMaxComments}
                  onChange={(e) => setDailyMaxComments(parseInt(e.target.value) || 20)}
                  className="mt-2"
                  min="1"
                  max="100"
                />
                <p className="text-muted mt-1 text-xs">Max: 100 per day</p>
              </div>
              <div>
                <Label htmlFor="rateSpacing" className="text-sm">
                  Rate Spacing (seconds)
                </Label>
                <TextField
                  id="rateSpacing"
                  type="number"
                  value={rateSpacingMs / 1000}
                  onChange={(e) => setRateSpacingMs((parseInt(e.target.value) || 3) * 1000)}
                  className="mt-2"
                  min="1"
                  max="60"
                />
                <p className="text-muted mt-1 text-xs">Min: 3 seconds between posts</p>
              </div>
            </div>
          </div>

          {/* Read Budget */}
          <div>
            <Label htmlFor="maxReads" className="text-base font-semibold">
              Max Reads per Scan
            </Label>
            <TextField
              id="maxReads"
              type="number"
              value={maxReadsPerScan}
              onChange={(e) => setMaxReadsPerScan(parseInt(e.target.value) || 20)}
              className="mt-2"
              min="1"
              max="50"
            />
            <p className="text-muted mt-1 text-sm">
              Free tier limit: 100 reads/month total. Each scan will use up to {maxReadsPerScan}{" "}
              reads.
            </p>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button color="secondary" onClick={onClose} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={handleSave}
            loading={saveSettingsMutation.isLoading}
            className="flex-1 sm:flex-none"
          >
            Save Settings
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
