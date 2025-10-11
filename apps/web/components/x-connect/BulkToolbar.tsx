/**
 * Bulk Toolbar - Select actions and template editor
 */

import { Button, Badge } from "@quillsocial/ui";

interface BulkToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onSelectNotFollowed: () => void;
  template: string;
  onTemplateChange: (template: string) => void;
  topics: string[];
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
}: BulkToolbarProps) {
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

        {/* Topics Display */}
        {topics.length > 0 && (
          <div className="mt-3">
            <p className="text-muted mb-2 text-xs font-medium">Active Topics:</p>
            <div className="flex flex-wrap gap-1">
              {topics.map((topic) => (
                <Badge key={topic} variant="gray">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
