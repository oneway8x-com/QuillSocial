import PageWrapper from "@components/PageWrapper";
import { BlogMarkdownEditor } from "@components/blog-editor/BlogMarkdownEditor";
import InputPanel from "@components/post-factory/InputPanel";
import OutputPanel from "@components/post-factory/OutputPanel";
import { parseXThread } from "@components/post-factory/utils";
import Shell from "@quillsocial/features/shell/Shell";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";
import { trpc } from "@quillsocial/trpc/react";
import { HeadSeo, Button, TextArea, showToast } from "@quillsocial/ui";
import {
  PenTool,
  CalendarDays,
  Copy,
  Save,
  Wand,
} from "@quillsocial/ui/components/icon";
import { useRouter } from "next/router";
import React, { useState, useEffect, useRef } from "react";

// Helper: split a single carousel text into individual slide strings.
// Supports inputs that are either already an array, or a single string that
// contains slide markers like "Slide 1:" or double newlines between slides.
function parseCarouselStringToSlides(input?: string | string[] | null): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;

  const text = input as string;

  // If the text contains explicit "Slide N:" markers, split on those markers.
  // Keep the markers on each slide so existing parsers that strip the heading still work.
  const slideMarkerRegex = /(?:^|\n)\s*(Slide\s+\d+:)/i;

  // Strategy:
  // 1. If we can find multiple "Slide <num>:" occurrences, split on positions before each marker.
  // 2. Otherwise, split on two or more newlines which commonly separate slides.

  const markers = Array.from(text.matchAll(/Slide\s+\d+:/gi));
  if (markers.length > 1) {
    // Split by regex that captures the marker so we can recombine marker + content
    const parts: string[] = [];
    const splitRegex = /(Slide\s+\d+:)/gi;
    const tokens = text.split(splitRegex).map((t) => t.trim()).filter(Boolean);
    // tokens will be like ["Slide 1:", "Heading...", "Slide 2:", "Heading..."]
    for (let i = 0; i < tokens.length; i += 2) {
      const marker = tokens[i];
      const content = tokens[i + 1] || "";
      parts.push(`${marker} ${content}`.trim());
    }
    return parts.map((p) => p.trim()).filter(Boolean);
  }

  // Fallback: split on two or more newlines
  const chunks = text.split(/\n{2,}/).map((c) => c.trim()).filter(Boolean);
  return chunks;
}

// Helper function to parse X/Twitter thread content into individual tweets
// parseXThread is now in utils and imported above

interface Tab {
  id: string;
  name: string;
}

const PostFactoryPage: React.FC & { PageWrapper?: any } = () => {
  const { t } = useLocale();
  const router = useRouter();
  const { ideaId } = router.query;

  const [outline, setOutline] = useState(
    "Hook, 3 lessons on pricing ladder, example, CTA to pricing checklist"
  );
  const [tone, setTone] = useState<"friendly" | "authoritative" | "contrarian">(
    "authoritative"
  );
  const [activeTab, setActiveTab] = useState("linkedin");
  const [cta, setCta] = useState("");
  const [utm, setUtm] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    ("linkedin" | "x" | "carousel" | "shorts" | "blog")[]
  >(["linkedin", "x", "carousel", "shorts", "blog"]);
  const [xThreadItems, setXThreadItems] = useState<string[]>([]);
  const [carouselSlides, setCarouselSlides] = useState<string[]>([]);
  const [currentPostId, setCurrentPostId] = useState<number | undefined>(undefined);
  const [savedCloudFiles, setSavedCloudFiles] = useState<Array<{
    id: number;
    cloudFileId: string;
    fileExt: string;
    fileName: string;
  }>>([]);

  // Fetch idea from ideas-pillars if ideaId is provided
  const { data: ideas } = trpc.viewer.ideasPillars.listIdeas.useQuery(
    {},
    { enabled: !!ideaId }
  );

  // Fetch existing post data if ideaId is provided
  const { data: existingPost } = trpc.viewer.postFactory.getPost.useQuery(
    { ideaId: typeof ideaId === "string" ? ideaId : undefined },
    {
      enabled: !!ideaId,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Track if we've already loaded a post to prevent duplicate toasts
  const loadedPostRef = useRef<string | null>(null);

  // Load outline from idea when data is available
  useEffect(() => {
    if (ideaId && ideas) {
      const idea = ideas.find((i) => i.id === ideaId);

      // First, check if there's an existing post to load
      if (existingPost) {
        const postKey = `${
          existingPost.postId
        }-${existingPost.createdAt.getTime()}`;
        const isNewLoad = loadedPostRef.current !== postKey;

        setCurrentPostId(existingPost.postId);
        setOutline(existingPost.outline);
        if (existingPost.tone) {
          setTone(
            existingPost.tone as "friendly" | "authoritative" | "contrarian"
          );
        }
        if (existingPost.outputs) {
          // Handle new format where x and carousel might be arrays
          const xContent = Array.isArray(existingPost.outputs.x)
            ? existingPost.outputs.x.join("\n\n")
            : existingPost.outputs.x || "";

          const carouselContent = Array.isArray(existingPost.outputs.carousel)
            ? existingPost.outputs.carousel.join("\n\n")
            : existingPost.outputs.carousel || "";

          setOutputs({
            linkedin: (existingPost.outputs.linkedin as string) || "",
            x: xContent,
            carousel: carouselContent,
            shorts: (existingPost.outputs.shorts as string) || "",
            blog: (existingPost.outputs.blog as string) || "",
          });

          // Parse X thread if it exists
          if (existingPost.outputs.x) {
            const threadItems = Array.isArray(existingPost.outputs.x)
              ? existingPost.outputs.x
              : parseXThread(existingPost.outputs.x as string);
            setXThreadItems(threadItems);
          }

          // Parse carousel slides if they exist (split single-string into slides)
          if (existingPost.outputs.carousel) {
            const slides = parseCarouselStringToSlides(existingPost.outputs.carousel as any);
            setCarouselSlides(slides);
          }
        }

        // Load saved cloudFiles (carousel images/PDF)
        if (existingPost.cloudFiles && existingPost.cloudFiles.length > 0) {
          setSavedCloudFiles(existingPost.cloudFiles);
        }

        if (existingPost.cta) {
          setCta(existingPost.cta);
        }
        if (existingPost.utm) {
          setUtm(existingPost.utm);
        }

        // Only show toast if this is a new load (not a re-render)
        if (isNewLoad) {
          loadedPostRef.current = postKey;
          showToast("Loaded saved post from database", "success");
        }
      } else if (idea?.outline) {
        // If no existing post, load from outline
        setOutline(idea.outline.text);
        const toneMap = {
          FRIENDLY: "friendly" as const,
          AUTHORITATIVE: "authoritative" as const,
          CONTRARIAN: "contrarian" as const,
        };
        setTone(toneMap[idea.outline.tone] || "friendly");
        showToast("Loaded outline from idea", "success");
      } else if (idea) {
        // Use the idea title as a starting point
        setOutline(idea.title);
        showToast(
          "Loaded idea. You can expand it to an outline first.",
          "success"
        );
      }
    } else if (!ideaId) {
      // Reset form when no ideaId
      setOutline("");
      setTone("authoritative");
      setSelectedPlatforms(["linkedin", "x", "carousel", "shorts", "blog"]);
      setCta("");
      setUtm("?utm_source=li&utm_medium=post");
      setOutputs({
        linkedin: "",
        x: "",
        carousel: "",
        shorts: "",
        blog: "",
      });
      setXThreadItems([]);
    }
  }, [ideaId, ideas, existingPost]);

  const [outputs, setOutputs] = useState({
    linkedin: "",
    x: "",
    carousel: "",
    shorts: "",
    blog: "",
  });

  // tRPC mutations
  const saveGeneratedPostsMutation =
    trpc.viewer.postFactory.saveGeneratedPosts.useMutation({
      onSuccess: (data) => {
        setCurrentPostId(data.postId);
        showToast("Content saved successfully!", "success");
      },
      onError: (error) => {
        showToast(`Error saving: ${error.message}`, "error");
      },
    });

  // Save a single platform's output (user-edited) without overwriting other platforms
  const handleSavePlatform = (platform: "linkedin" | "x" | "carousel" | "shorts" | "blog") => {
    // Start with the current UI outputs so we preserve any other platforms
    const outputsToSave: Record<string, string | string[] | undefined> = {
      ...outputs,
    } as any;

    // For X and carousel we may prefer the array forms if the UI has them
    if (platform === "x") {
      if (xThreadItems && xThreadItems.length > 0) {
        outputsToSave.x = xThreadItems;
      } else if (outputs.x) {
        outputsToSave.x = outputs.x;
      } else {
        outputsToSave.x = undefined;
      }
    } else if (platform === "carousel") {
      if (carouselSlides && carouselSlides.length > 0) {
        outputsToSave.carousel = carouselSlides;
      } else if (outputs.carousel) {
        outputsToSave.carousel = outputs.carousel;
      } else {
        outputsToSave.carousel = undefined;
      }
    } else {
      outputsToSave[platform] = outputs[platform as keyof typeof outputs];
    }

    saveGeneratedPostsMutation.mutate({
      outline,
      tone,
      outputs: outputsToSave as any,
      cta,
      utm,
      ideaId: typeof ideaId === "string" ? ideaId : undefined,
      postId: currentPostId,
    });
  };

  const generateAllMutation = trpc.viewer.postFactory.generateAll.useMutation({
    onSuccess: (data) => {
      // Handle new format where x and carousel are arrays
      const xContent = Array.isArray(data.outputs.x)
        ? data.outputs.x.join("\n\n")
        : data.outputs.x || "";

      const carouselContent = Array.isArray(data.outputs.carousel)
        ? data.outputs.carousel.join("\n\n")
        : data.outputs.carousel || "";

      setOutputs({
        linkedin: (data.outputs.linkedin as string) || "",
        x: xContent,
        carousel: carouselContent,
        shorts: (data.outputs.shorts as string) || "",
        blog: (data.outputs.blog as string) || "",
      });

      // Parse X thread into individual items
      if (data.outputs.x) {
        const threadItems = Array.isArray(data.outputs.x)
          ? data.outputs.x
          : parseXThread(data.outputs.x as string);
        setXThreadItems(threadItems);
      }

      // Parse carousel into individual slides
      if (data.outputs.carousel) {
        const slides = parseCarouselStringToSlides(data.outputs.carousel as any);
        setCarouselSlides(slides);
      }

      // Automatically save to database after generation
      saveGeneratedPostsMutation.mutate({
        outline,
        tone,
        outputs: data.outputs,
        cta,
        utm,
        ideaId: typeof ideaId === "string" ? ideaId : undefined,
      });

      showToast("Content generated successfully!", "success");
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, "error");
    },
  });

  const expandOutlineMutation =
    trpc.viewer.postFactory.expandOutline.useMutation({
      onSuccess: (data) => {
        setOutline(data.outline);
        setTone(data.tone as "friendly" | "authoritative" | "contrarian");
        showToast("Outline expanded successfully!", "success");
      },
      onError: (error) => {
        showToast(`Error: ${error.message}`, "error");
      },
    });

  const regenerateMutation = trpc.viewer.postFactory.regenerate.useMutation({
    onSuccess: (data) => {
      // Handle new format where x and carousel are arrays
      const content = Array.isArray(data.content)
        ? data.content.join("\n\n")
        : data.content;

      // Build the outputs object we'll show in the UI (string form for display)
      const displayOutputs = {
        ...outputs,
        [data.platform]: content,
      };

      // Update UI state
      setOutputs(displayOutputs);

      // Parse X thread into individual items if regenerating X
      if (data.platform === "x" && data.content) {
        const threadItems = Array.isArray(data.content)
          ? data.content
          : parseXThread(data.content as string);
        setXThreadItems(threadItems);
      }

      // Parse carousel into individual slides if regenerating carousel
      if (data.platform === "carousel" && data.content) {
        const slides = parseCarouselStringToSlides(data.content as any);
        setCarouselSlides(slides);
      }

      // Prepare outputs for saving. For channels that return arrays (x/carousel),
      // keep the array form when available so the DB stores the richer shape.
      const outputsToSave: Record<string, string | string[] | undefined> = {
        ...outputs,
        [data.platform]: data.content as any,
      };

      // If we regenerated X and parsed thread items, prefer saving the thread items array
      if (data.platform === "x") {
        const threadItems = Array.isArray(data.content)
          ? data.content
          : data.content
          ? parseXThread(data.content as string)
          : [];
        if (threadItems.length > 0) {
          outputsToSave.x = threadItems;
        }
      }

      // If we regenerated carousel, prefer saving slides as an array
      if (data.platform === "carousel") {
        const slides = Array.isArray(data.content)
          ? data.content
          : data.content
          ? [data.content as string]
          : [];
        if (slides.length > 0) {
          outputsToSave.carousel = slides;
        }
      }

      // Call save mutation to persist the single-platform update
      saveGeneratedPostsMutation.mutate({
        outline,
        tone,
        outputs: outputsToSave as any,
        cta,
        utm,
        ideaId: typeof ideaId === "string" ? ideaId : undefined,
      });

      showToast(`${data.platform} content regenerated!`, "success");
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, "error");
    },
  });

  const tabs: Tab[] = [
    { id: "linkedin", name: "LinkedIn" },
    { id: "x", name: "X Thread" },
    { id: "carousel", name: "IG Carousel" },
    { id: "shorts", name: "Shorts" },
    { id: "blog", name: "Blog" },
  ];

  const togglePlatform = (
    platform: "linkedin" | "x" | "carousel" | "shorts" | "blog"
  ) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        return prev.filter((p) => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };

  const handleGenerateAll = () => {
    if (!outline.trim()) {
      showToast("Please enter an outline", "error");
      return;
    }

    if (selectedPlatforms.length === 0) {
      showToast("Please select at least one platform", "error");
      return;
    }

    // Always generate for all supported platforms regardless of selection
    generateAllMutation.mutate({
      outline,
      tone,
      platforms: ["linkedin", "x", "carousel", "blog"], //disable shorts for now
      cta,
      utm,
    });
  };

  const handleSchedule = () => {
    // TODO: Integrate with scheduling system
    router.push("/calendar");
  };

  const handleCopy = () => {
    const content = outputs[activeTab as keyof typeof outputs];
    navigator.clipboard.writeText(content);
    showToast("Content copied to clipboard", "success");
  };

  const handleRegenerate = () => {
    if (!outline.trim()) {
      showToast("Please enter an outline first", "error");
      return;
    }

    regenerateMutation.mutate({
      outline,
      platform: activeTab as "linkedin" | "x" | "carousel" | "shorts" | "blog",
      cta,
      utm,
    });
  };

  // Save current edits (including edited X thread items) back to the DB
  const handleSaveEdits = async () => {
    // Prepare outputs to save: if xThreadItems exists, prefer that as an array
    const outputsToSave: Record<string, string | string[] | undefined> = {
      ...outputs,
    } as any;

    if (xThreadItems && xThreadItems.length > 0) {
      outputsToSave.x = xThreadItems;
    }

    // If user edited carousel slides, save as an array so DB stores slide items
    if (carouselSlides && carouselSlides.length > 0) {
      outputsToSave.carousel = carouselSlides;
    }

    saveGeneratedPostsMutation.mutate({
      outline,
      tone,
      outputs: outputsToSave as any,
      cta,
      utm,
      ideaId: typeof ideaId === "string" ? ideaId : undefined,
    });
  };

  return (
    <>
      <HeadSeo
        title={t("Post Factory")}
        description={t("Create multi-format content from a single outline")}
      />

      <Shell
        withoutSeo
        heading={t("Post Factory")}
        subtitle="One outline → multi-format outputs"
        CTA={
          <div className="flex gap-3">
            <Button
              color="secondary"
              StartIcon={Save}
              onClick={() => handleSaveEdits()}
            >
              {t("Save Draft")}
            </Button>
            <Button StartIcon={CalendarDays} onClick={handleSchedule}>
              {t("Schedule Now")}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <InputPanel
            outline={outline}
            setOutline={setOutline}
            tone={tone}
            setTone={setTone}
            selectedPlatforms={selectedPlatforms}
            togglePlatform={togglePlatform}
            handleGenerateAll={handleGenerateAll}
            generateLoading={generateAllMutation.isLoading}
            cta={cta}
            setCta={setCta}
            utm={utm}
            setUtm={setUtm}
          />

          <OutputPanel
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            outputs={outputs}
            setOutputs={setOutputs}
            xThreadItems={xThreadItems}
            setXThreadItems={setXThreadItems}
            carouselSlides={carouselSlides}
            setCarouselSlides={setCarouselSlides}
            regenerateLoading={regenerateMutation.isLoading}
            handleCopy={handleCopy}
            handleRegenerate={handleRegenerate}
            currentPostId={currentPostId}
            savedCloudFiles={savedCloudFiles}
            onSaveCloudFiles={(cloudFileIds: number[]) => {
              // Save cloud files to the post
              saveGeneratedPostsMutation.mutate({
                outline,
                tone,
                outputs,
                cta,
                utm,
                ideaId: typeof ideaId === "string" ? ideaId : undefined,
                cloudFileIds,
                postId: currentPostId,
              });
            }}
            onSavePlatform={handleSavePlatform}
          />
        </div>
      </Shell>
    </>
  );
};
PostFactoryPage.PageWrapper = PageWrapper;

export default PostFactoryPage;
