import {
  Badge,
  Button,
  Select,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  TextArea,
  showToast,
} from "@quillsocial/ui";
import {
  ExternalLink,
  RefreshCw,
  X,
} from "@quillsocial/ui/components/icon";
import React, { useEffect, useState } from "react";
import { trpc } from "@quillsocial/trpc/react";
import type { Idea, Outline, Tone } from "./types";

// OutlineDrawer Component Props
interface OutlineDrawerProps {
  open: boolean;
  idea: Idea | null;
  existingOutline: Outline | null;
  onSave: (outline: Outline) => void;
  onPromote: (idea: Idea) => void;
  onClose: () => void;
  onGenerate?: (ideaId: string, tone: Tone) => Promise<{ text: string; tone: string }>;
  isGenerating?: boolean;
}

export function OutlineDrawer({
  open,
  idea,
  existingOutline,
  onSave,
  onPromote,
  onClose,
  onGenerate,
  isGenerating: externalIsGenerating = false,
}: OutlineDrawerProps) {
  const [outlineDraft, setOutlineDraft] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [isDirty, setIsDirty] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastIdeaId, setLastIdeaId] = useState<string | null>(null);
  const utils = trpc.useContext();

  const saveOutlineMutation = trpc.viewer.ideasPillars.saveOutline.useMutation({
    onSuccess: () => {
      utils.viewer.ideasPillars.listIdeas.invalidate();
      showToast("Outline saved successfully", "success");
    },
    onError: (error) => {
      showToast(error.message || "Failed to save outline", "error");
    },
  });

  const actuallyGenerating = externalIsGenerating || isGenerating;

  // Initialize outline when drawer opens or idea changes
  useEffect(() => {
    // Only reset if drawer just opened or if we switched to a different idea
    const ideaChanged = idea && idea.id !== lastIdeaId;

    if (open && idea && (ideaChanged || !lastIdeaId)) {
      console.log("outline_opened or idea changed", { ideaId: idea.id, ideaChanged });
      setLastIdeaId(idea.id);

      if (existingOutline) {
        setOutlineDraft(existingOutline.text);
        setTone(existingOutline.metadata.tone);
        setIsDirty(false);
      } else {
        // Clear the draft for new outlines - user will click generate
        setOutlineDraft("");
        setIsDirty(false);
      }
    }

    // Reset lastIdeaId when drawer closes
    if (!open) {
      setLastIdeaId(null);
    }
  }, [open, idea, existingOutline, lastIdeaId]);

  // Handle regenerate
  const handleRegenerate = async () => {
    if (!idea || !onGenerate) return;

    console.log("outline_generated", { ideaId: idea.id, tone });
    setIsGenerating(true);

    try {
      const result = await onGenerate(idea.id, tone);
      console.log("Generated outline result:", result);
      console.log("Setting outline text:", result.text);
      setOutlineDraft(result.text);
      setIsDirty(true);

      // Persist the generated outline locally without delegating to parent to avoid
      // closing the drawer. Use the same tRPC mutation as the page.
      try {
        const toneUpper = tone.toUpperCase() as "FRIENDLY" | "AUTHORITATIVE" | "CONTRARIAN";
        await saveOutlineMutation.mutateAsync({
          ideaId: idea.id,
          text: result.text,
          tone: toneUpper,
        });

        // Mark as not dirty after successful save
        setIsDirty(false);
      } catch (saveError) {
        console.error("Failed to auto-save generated outline:", saveError);
      }

      showToast("Outline generated successfully", "success");
    } catch (error) {
      console.error("Failed to generate outline:", error);
      showToast("Failed to generate outline. Please try again.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle save
  const handleSave = () => {
    if (!idea || outlineDraft.trim().length < 30) return;

    const outline: Outline = {
      id: existingOutline?.id ?? `o_${Date.now()}`,
      ideaId: idea.id,
      text: outlineDraft,
      metadata: { tone },
    };

    console.log("outline_saved", { ideaId: idea.id });
    onSave(outline);
    setIsDirty(false);
    showToast("Outline saved", "success");
  };

  // Handle promote
  const handlePromote = () => {
    if (!idea) return;

    console.log("outline_promoted", { ideaId: idea.id });
    onPromote(idea);
    onClose();
  };

  // Handle close with dirty check
  const handleClose = () => {
    if (isDirty) {
      if (window.confirm("Discard changes?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOutlineDraft(e.target.value);
    setIsDirty(true);
  };

  if (!idea) return null;

  const ideaSnippet =
    idea.title.length > 56 ? `${idea.title.slice(0, 56)}...` : idea.title;

  const toneOptions = [
    { label: "Friendly", value: "friendly" },
    { label: "Authoritative", value: "authoritative" },
    { label: "Contrarian", value: "contrarian" },
  ];

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        position="right"
        size="lg"
        className="flex flex-col overflow-hidden"
        data-testid="outline-drawer"
      >
        <SheetHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-xl font-semibold">Outline</SheetTitle>
              <SheetDescription className="mt-1 text-sm text-gray-600">
                From idea → {ideaSnippet}
              </SheetDescription>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1 hover:bg-gray-100"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="tone-select" className="text-sm font-medium">
                Tone:
              </label>
              <Select
                id="tone-select"
                value={toneOptions.find((opt) => opt.value === tone)}
                onChange={(option: any) => {
                  setTone(option.value);
                  setIsDirty(true);
                }}
                options={toneOptions}
                className="w-40"
                data-testid="outline-tone"
              />
            </div>

            {idea.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {idea.tags.map((tag, index) => (
                  <Badge key={index} variant="blue" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <button
              className="ml-auto flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
              onClick={() => console.log("View original idea")}
            >
              <ExternalLink className="h-3 w-3" />
              View original idea
            </button>
          </div>
        </SheetHeader>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto py-4">
          <TextArea
            value={outlineDraft}
            onChange={handleTextChange}
            placeholder="Your outline will appear here..."
            className="min-h-[300px] w-full resize-none rounded-lg border p-4 font-mono text-sm"
            data-testid="outline-textarea"
          />

          <div className="mt-4">
            <Button
              color="secondary"
              onClick={handleRegenerate}
              disabled={actuallyGenerating || !onGenerate}
              StartIcon={!actuallyGenerating ? RefreshCw : undefined}
              data-testid="outline-regenerate"
            >
              {actuallyGenerating ? "Processing…" : "Generate Outline"}
            </Button>
          </div>
        </div>

        {/* Actions Footer */}
        <SheetFooter className="border-t pt-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button
              color="primary"
              onClick={handleSave}
              disabled={outlineDraft.trim().length < 30}
              className="flex-1"
              data-testid="outline-save"
              aria-label="Save outline"
            >
              Save Outline
            </Button>
            <Button
              color="secondary"
              onClick={handlePromote}
              className="flex-1"
              data-testid="outline-promote"
              aria-label="Send to Post Factory"
            >
              Promote to Post
            </Button>
            <Button
              color="minimal"
              onClick={handleClose}
              className="sm:w-auto"
              aria-label="Close drawer"
            >
              Close
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
