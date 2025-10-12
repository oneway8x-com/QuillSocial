/**
 * Bulk Toolbar - Select actions and template editor
 */

import { useState } from "react";
import { Button, Badge } from "@quillsocial/ui";
import { X, Plus } from "lucide-react";

interface BulkToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onSelectNotFollowed: () => void;
  template: string;
  onTemplateChange: (template: string) => void;
  topics: string[];
  onTopicsChange: (topics: string[]) => void;
}

const DEFAULT_TEMPLATE = `Let's #connect if you're into:
🎨 Frontend • 💼 Backend • 👩‍💻 GenAI • ✨ Full-stack • 🧑‍💻 DevOps • ✅ DSA • 💻 LeetCode • 🧠 AI/ML • 🧱 Web3 • 📊 Data Science • 💸 Freelancing • 🐍 Python • 🔨 Startups

Hey {author}, loved your post! I'm building in public and would love to connect with folks into {topics}. #buildinpublic #letsconnect`;

const PRESETS = [
  {
    name: "Friendly dev",
    template: `Hey {author}, loved your post! 👋 I'm building in public and connecting with folks into {topics}. Let's connect! #buildinpublic #letsconnect`,
  },
  {
    name: "Founder vibe",
    template: `{author} - great insights! 🚀 Founder here connecting with people in {topics}. Would love to connect and share our journeys! #buildinpublic`,
  },
  {
    name: "Straight to the point",
    template: `{author} - let's connect! Working on {topics} and always looking to expand my network. #connect`,
  },
];

export default function BulkToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onSelectNone,
  onSelectNotFollowed,
  template,
  onTemplateChange,
  topics,
  onTopicsChange,
}: BulkToolbarProps) {
  const [topicInput, setTopicInput] = useState("");
  const [isEditingTopics, setIsEditingTopics] = useState(false);

  const handleAddTopic = () => {
    const trimmed = topicInput.trim();
    if (trimmed && !topics.includes(trimmed)) {
      onTopicsChange([...topics, trimmed]);
      setTopicInput("");
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    onTopicsChange(topics.filter((t) => t !== topicToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTopic();
    }
  };

  return (
    <>
      {/* Selection Controls */}
      <div className="border-subtle mb-4 rounded-2xl border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted text-sm font-medium">Select:</span>
          <Button color="minimal" size="sm" onClick={onSelectAll}>
            All ({totalCount})
          </Button>
          <Button color="minimal" size="sm" onClick={onSelectNone}>
            None
          </Button>
          <Button color="minimal" size="sm" onClick={onSelectNotFollowed}>
            Not Followed
          </Button>
          {selectedCount > 0 && (
            <Badge variant="blue" className="ml-auto">
              {selectedCount} selected
            </Badge>
          )}
        </div>
      </div>

      {/* Template Editor */}
      <div className="border-subtle mb-6 rounded-2xl border bg-card p-4 shadow-sm">
        {/* Template Editor */}
        <div className="mb-3">
          <label className="text-foreground mb-2 block text-sm font-medium">
            Comment Template
          </label>
          <textarea
            className="border-subtle text-foreground w-full rounded-lg border bg-default p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            rows={5}
            value={template || DEFAULT_TEMPLATE}
            onChange={(e) => onTemplateChange(e.target.value)}
            placeholder="Use {author} for @username and {topics} for selected topics"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-muted text-xs">
              Tokens: <code>{"{author}"}</code> → @username, <code>{"{topics}"}</code> → selected
              topics
            </p>
            <p className="text-muted text-xs">
              {(template || DEFAULT_TEMPLATE).length}/280 characters
            </p>
          </div>
        </div>

        {/* Presets */}
        <div>
          <p className="text-muted mb-2 text-xs font-medium">Quick Presets:</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.name}
                color="secondary"
                size="sm"
                onClick={() => onTemplateChange(preset.template)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Topics Display - Editable */}
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-muted text-xs font-medium">Active Topics:</p>
            <Button
              color="minimal"
              size="sm"
              onClick={() => setIsEditingTopics(!isEditingTopics)}
            >
              {isEditingTopics ? "Done" : "Edit"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {topics.map((topic) => (
              <div key={topic} className="group relative">
                <Badge variant="gray" className="pr-6">
                  {topic}
                </Badge>
                {isEditingTopics && (
                  <button
                    onClick={() => handleRemoveTopic(topic)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500/10 text-red-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/20"
                    title="Remove topic"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {isEditingTopics && (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add topic..."
                  className="border-subtle text-foreground h-6 w-24 rounded border bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleAddTopic}
                  disabled={!topicInput.trim()}
                  className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white disabled:opacity-50 hover:opacity-90"
                  title="Add topic"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          {isEditingTopics && (
            <p className="text-muted mt-2 text-xs">
              Topics are saved locally and will be used in comment templates with {"{topics}"}.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
