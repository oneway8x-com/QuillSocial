import PageWrapper from "@components/PageWrapper";
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
import React, { useState, useEffect } from "react";

// Helper function to parse X/Twitter thread content into individual tweets
function parseXThread(content: string): string[] {
  // Try to split by numbered pattern (1/, 2/, 3/, etc.)
  const numberedPattern = /\d+\/\s*/g;

  // Check if content has numbered format
  if (numberedPattern.test(content)) {
    const items = content.split(numberedPattern).filter((item) => item.trim());
    return items;
  }

  // Fallback: split by double newlines or single newlines if content is short
  const byDoubleNewline = content.split(/\n\n+/).filter((item) => item.trim());
  if (byDoubleNewline.length > 1) {
    return byDoubleNewline;
  }

  // Last resort: split by single newlines
  return content.split(/\n/).filter((item) => item.trim());
}

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
  const [cta, setCta] = useState("Join the pricing checklist");
  const [utm, setUtm] = useState("?utm_source=li&utm_medium=post");
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    ("linkedin" | "x" | "carousel" | "shorts" | "blog")[]
  >(["linkedin"]);
  const [xThreadItems, setXThreadItems] = useState<string[]>([]);
  const [carouselSlides, setCarouselSlides] = useState<string[]>([]);

  // Fetch idea from ideas-pillars if ideaId is provided
  const { data: ideas } = trpc.viewer.ideasPillars.listIdeas.useQuery(
    {},
    { enabled: !!ideaId }
  );

  // Fetch existing post data if ideaId is provided
  const { data: existingPost } = trpc.viewer.postFactory.getPost.useQuery(
    { ideaId: typeof ideaId === "string" ? ideaId : undefined },
    { enabled: !!ideaId }
  );

  // Load outline from idea when data is available
  useEffect(() => {
    if (ideaId && ideas) {
      const idea = ideas.find((i) => i.id === ideaId);

      // First, check if there's an existing post to load
      if (existingPost) {
        setOutline(existingPost.outline);
        if (existingPost.tone) {
          setTone(
            existingPost.tone as "friendly" | "authoritative" | "contrarian"
          );
        }
        if (existingPost.outputs) {
          // Handle new format where x and carousel might be arrays
          const xContent = Array.isArray(existingPost.outputs.x)
            ? existingPost.outputs.x.join('\n\n')
            : existingPost.outputs.x || "";

          const carouselContent = Array.isArray(existingPost.outputs.carousel)
            ? existingPost.outputs.carousel.join('\n\n')
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

          // Parse carousel slides if they exist
          if (existingPost.outputs.carousel) {
            const slides = Array.isArray(existingPost.outputs.carousel)
              ? existingPost.outputs.carousel
              : [existingPost.outputs.carousel as string];
            setCarouselSlides(slides);
          }
        }
        if (existingPost.cta) {
          setCta(existingPost.cta);
        }
        if (existingPost.utm) {
          setUtm(existingPost.utm);
        }
        showToast("Loaded saved post from database", "success");
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
      setSelectedPlatforms(["linkedin"]);
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
        showToast("Content saved successfully!", "success");
      },
      onError: (error) => {
        showToast(`Error saving: ${error.message}`, "error");
      },
    });

  const generateAllMutation = trpc.viewer.postFactory.generateAll.useMutation({
    onSuccess: (data) => {
      // Handle new format where x and carousel are arrays
      const xContent = Array.isArray(data.outputs.x)
        ? data.outputs.x.join('\n\n')
        : data.outputs.x || "";

      const carouselContent = Array.isArray(data.outputs.carousel)
        ? data.outputs.carousel.join('\n\n')
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
        const slides = Array.isArray(data.outputs.carousel)
          ? data.outputs.carousel
          : [data.outputs.carousel as string];
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
        ? data.content.join('\n\n')
        : data.content;

      setOutputs((prev) => ({
        ...prev,
        [data.platform]: content,
      }));

      // Parse X thread into individual items if regenerating X
      if (data.platform === "x" && data.content) {
        const threadItems = Array.isArray(data.content)
          ? data.content
          : parseXThread(data.content as string);
        setXThreadItems(threadItems);
      }

      // Parse carousel into individual slides if regenerating carousel
      if (data.platform === "carousel" && data.content) {
        const slides = Array.isArray(data.content)
          ? data.content
          : [data.content as string];
        setCarouselSlides(slides);
      }

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

    generateAllMutation.mutate({
      outline,
      tone,
      platforms: selectedPlatforms,
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
            <Button color="secondary" StartIcon={Save} onClick={() => handleSaveEdits()}>
              {t("Save Draft")}
            </Button>
            <Button StartIcon={CalendarDays} onClick={handleSchedule}>
              {t("Schedule Now")}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="mb-4 flex justify-between items-start">
              <div>
                <h3 className="text-base font-semibold mb-1">Input</h3>
                <p className="text-sm text-slate-500">Outline</p>
              </div>
              <Button
                size="sm"
                className="rounded-xl"
                onClick={handleGenerateAll}
                StartIcon={Wand}
                loading={generateAllMutation.isLoading}
                disabled={generateAllMutation.isLoading}
              >
                {generateAllMutation.isLoading ? "Generating..." : "Generate"}
              </Button>
            </div>

            <div className="space-y-4">
              <TextArea
                className="min-h-[200px] w-full rounded-xl border-slate-200"
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                placeholder="Hook, 3 bullets, example, CTA"
              />

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-600 font-medium block mb-2">
                    Tone
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTone("friendly")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        tone === "friendly"
                          ? "bg-blue-500 text-white"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      Friendly
                    </button>
                    <button
                      onClick={() => setTone("authoritative")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        tone === "authoritative"
                          ? "bg-blue-500 text-white"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      Authoritative
                    </button>
                    <button
                      onClick={() => setTone("contrarian")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        tone === "contrarian"
                          ? "bg-blue-500 text-white"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      Contrarian
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-600 font-medium block mb-2">
                    Platforms
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => togglePlatform("linkedin")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        selectedPlatforms.includes("linkedin")
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      LinkedIn
                    </button>
                    <button
                      onClick={() => togglePlatform("x")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        selectedPlatforms.includes("x")
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      X
                    </button>
                    <button
                      onClick={() => togglePlatform("carousel")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        selectedPlatforms.includes("carousel")
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      Instagram
                    </button>
                    <button
                      onClick={() => togglePlatform("shorts")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        selectedPlatforms.includes("shorts")
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      YouTube
                    </button>
                    <button
                      onClick={() => togglePlatform("blog")}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                        selectedPlatforms.includes("blog")
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      Blog
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-semibold mb-1">Outputs</h3>
              <p className="text-sm text-slate-500">
                Preview & tweak each format
              </p>
            </div>

            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="mt-4">
                {activeTab === "carousel" ? (
                  <div className="space-y-3">
                    {carouselSlides.map((slide, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <TextArea
                          className="flex-1 min-h-[100px] rounded-xl border-slate-200"
                          value={slide}
                          onChange={(e) => {
                            const newSlides = [...carouselSlides];
                            newSlides[index] = e.target.value;
                            setCarouselSlides(newSlides);
                            // Update outputs as well
                            setOutputs({
                              ...outputs,
                              carousel: newSlides.join("\n\n"),
                            });
                          }}
                          placeholder={`Slide ${index + 1}: Title\n\n• Point 1\n• Point 2\n• Point 3`}
                        />
                        <button
                          onClick={() => {
                            const newSlides = carouselSlides.filter(
                              (_, i) => i !== index
                            );
                            setCarouselSlides(newSlides);
                            setOutputs({
                              ...outputs,
                              carousel: newSlides.join("\n\n"),
                            });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setCarouselSlides([
                          ...carouselSlides,
                          `Slide ${carouselSlides.length + 1}: Title\n\n• Point 1\n• Point 2\n• Point 3`,
                        ]);
                      }}
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      + Add slide
                    </button>
                  </div>
                ) : activeTab === "x" ? (
                  <div className="space-y-3">
                    {xThreadItems.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <TextArea
                          className="flex-1 min-h-[80px] rounded-xl border-slate-200"
                          value={item}
                          onChange={(e) => {
                            const newItems = [...xThreadItems];
                            newItems[index] = e.target.value;
                            setXThreadItems(newItems);
                            // Update outputs as well
                            setOutputs({
                              ...outputs,
                              x: newItems
                                .map((t, i) => `${i + 1}/ ${t}`)
                                .join("\n\n"),
                            });
                          }}
                        />
                        <button
                          onClick={() => {
                            const newItems = xThreadItems.filter(
                              (_, i) => i !== index
                            );
                            setXThreadItems(newItems);
                            setOutputs({
                              ...outputs,
                              x: newItems
                                .map((t, i) => `${i + 1}/ ${t}`)
                                .join("\n\n"),
                            });
                          }}
                          className="flex-shrink-0 text-red-500 hover:text-red-700 px-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setXThreadItems([...xThreadItems, ""]);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add tweet
                    </button>
                  </div>
                ) : (
                  <TextArea
                    className="min-h-[300px] w-full rounded-xl border-slate-200"
                    value={outputs[activeTab as keyof typeof outputs]}
                    onChange={(e) =>
                      setOutputs({ ...outputs, [activeTab]: e.target.value })
                    }
                  />
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 my-4" />

              {/* CTA & UTM Inputs */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    placeholder="First-comment CTA"
                  />
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={utm}
                    onChange={(e) => setUtm(e.target.value)}
                    placeholder="UTM parameters"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="rounded-xl"
                    onClick={handleCopy}
                    StartIcon={Copy}
                  >
                    Copy
                  </Button>
                  <Button
                    className="rounded-xl"
                    color="secondary"
                    onClick={handleRegenerate}
                    StartIcon={Wand}
                    loading={regenerateMutation.isLoading}
                    disabled={regenerateMutation.isLoading}
                  >
                    {regenerateMutation.isLoading
                      ? "Regenerating..."
                      : "Regenerate"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Shell>
    </>
  );
};
PostFactoryPage.PageWrapper = PageWrapper;

export default PostFactoryPage;
