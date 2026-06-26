import React, { useState } from "react";
import { TextArea, Button, showToast } from "@quillsocial/ui";
import { Copy, Wand, Calendar, Send, Download, FileImage } from "@quillsocial/ui/components/icon";
import { BlogMarkdownEditor } from "@components/blog-editor/BlogMarkdownEditor";
import { trpc } from "@quillsocial/trpc/react";
import { InstallAppButtonWithoutPlanCheck } from "@quillsocial/app-store/components";
import SocialAvatar from "@quillsocial/features/shell/SocialAvatar";
import { ScheduleDialog } from "@components/write/ScheduleDialog";
import type { PluginType } from "@components/write/ScheduleDialog";

// Minimal markdown-to-HTML renderer (keeps it simple for copy/paste scenarios)
function renderMarkdownToHTML(markdown: string): string {
  if (!markdown) return "";
  // very small conversion: headings, bold, italic, links, images, lists, code
  let html = markdown;
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^\* (.*)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  return html;
}

type Outputs = {
  linkedin: string;
  x: string;
  carousel: string;
  shorts: string;
  blog: string;
};

type Props = {
  activeTab: string;
  setActiveTab: (t: string) => void;
  outputs: Outputs;
  setOutputs: (o: Outputs) => void;
  xThreadItems: string[];
  setXThreadItems: (items: string[]) => void;
  carouselSlides: string[];
  setCarouselSlides: (s: string[]) => void;
  regenerateLoading: boolean;
  handleCopy: () => void;
  handleRegenerate: () => void;
  currentPostId?: number;
  savedCloudFiles?: Array<{
    id: number;
    cloudFileId: string;
    fileExt: string;
    fileName: string;
  }>;
  onSaveCloudFiles: (cloudFileIds: number[]) => void;
  onSavePlatform?: (platform: "linkedin" | "x" | "carousel" | "shorts" | "blog") => void;
};

const tabs = [
  { id: "linkedin", name: "LinkedIn" },
  { id: "x", name: "X Thread" },
  { id: "carousel", name: "Carousel" },
  { id: "shorts", name: "Shorts" },
  { id: "blog", name: "Blog" },
];

const OutputPanel: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  outputs,
  setOutputs,
  xThreadItems,
  setXThreadItems,
  carouselSlides,
  setCarouselSlides,
  regenerateLoading,
  handleCopy,
  handleRegenerate,
  currentPostId,
  savedCloudFiles,
  onSaveCloudFiles,
  onSavePlatform,
}) => {
  const [isLinkedinScheduleOpen, setIsLinkedinScheduleOpen] = useState(false);
  const [isXScheduleOpen, setIsXScheduleOpen] = useState(false);
  const [isLinkedinPdfScheduleOpen, setIsLinkedinPdfScheduleOpen] = useState(false);
  const [linkedinScheduleDateTime, setLinkedinScheduleDateTime] = useState("");
  const [xScheduleDateTime, setXScheduleDateTime] = useState("");
  const [linkedinPdfScheduleDateTime, setLinkedinPdfScheduleDateTime] = useState("");

  // State for generated carousel images/PDF
  const [generatedCarouselImages, setGeneratedCarouselImages] = useState<Array<{
    id: number;
    cloudFileId: string;
    fileExt: string;
    fileName: string;
  }>>([]);
  const [generatedCarouselPdf, setGeneratedCarouselPdf] = useState<{
    id: number;
    cloudFileId: string;
    fileExt: string;
    fileName: string;
  } | null>(null);

  // State for signed URLs
  const [imageSignedUrls, setImageSignedUrls] = useState<Record<number, string>>({});
  const [pdfSignedUrl, setPdfSignedUrl] = useState<string>("");
  // State for combined generation
  const [isGeneratingCarousell, setIsGeneratingCarousell] = useState(false);

  // Load saved cloudFiles when they're available
  React.useEffect(() => {
    if (savedCloudFiles && savedCloudFiles.length > 0) {
      // Separate images from PDF based on file extension
      const images = savedCloudFiles.filter((cf) => cf.fileExt === "png" || cf.fileExt === "jpg" || cf.fileExt === "jpeg");
      const pdfs = savedCloudFiles.filter((cf) => cf.fileExt === "pdf");

      if (images.length > 0) {
        setGeneratedCarouselImages(images);
      }

      if (pdfs.length > 0) {
        setGeneratedCarouselPdf(pdfs[0]); // Take the first PDF
      }
    }
  }, [savedCloudFiles]);

  // Fetch signed URLs for images
  React.useEffect(() => {
    const fetchImageUrls = async () => {
      const urls: Record<number, string> = {};
      for (const image of generatedCarouselImages) {
        try {
          const response = await fetch(
            `/api/integrations/googlecloudstorage/get?file=${image.cloudFileId}.${image.fileExt}`
          );
          const data = await response.json();
          if (data.signedUrl) {
            urls[image.id] = data.signedUrl;
          }
        } catch (error) {
          console.error(`Error fetching signed URL for image ${image.id}:`, error);
        }
      }
      setImageSignedUrls(urls);
    };

    if (generatedCarouselImages.length > 0) {
      fetchImageUrls();
    }
  }, [generatedCarouselImages]);

  // Fetch signed URL for PDF
  React.useEffect(() => {
    const fetchPdfUrl = async () => {
      if (!generatedCarouselPdf) return;
      try {
        const response = await fetch(
          `/api/integrations/googlecloudstorage/get?file=${generatedCarouselPdf.cloudFileId}.${generatedCarouselPdf.fileExt}`
        );
        const data = await response.json();
        if (data.signedUrl) {
          setPdfSignedUrl(data.signedUrl);
        }
      } catch (error) {
        console.error("Error fetching signed URL for PDF:", error);
      }
    };

    if (generatedCarouselPdf) {
      fetchPdfUrl();
    } else {
      setPdfSignedUrl("");
    }
  }, [generatedCarouselPdf]);

  // Carousel generation mutation
  const generateCarouselMutation = trpc.viewer.postFactory.generateCarousel.useMutation({
    onSuccess: (data) => {
      if (data.format === "pdf") {
        setGeneratedCarouselPdf({
          id: data.cloudFile.id,
          cloudFileId: data.cloudFile.cloudFileId,
          fileExt: data.cloudFile.fileExt,
          fileName: data.cloudFile.fileName,
        });
        setGeneratedCarouselImages([]); // Clear images when PDF is generated
        setImageSignedUrls({}); // Clear image URLs

        // Save PDF cloudFile to post
        onSaveCloudFiles([data.cloudFile.id]);

        showToast("PDF generated and saved successfully!", "success");
      } else {
        setGeneratedCarouselImages(
          data.images.map((img) => ({
            id: img.id,
            cloudFileId: img.cloudFileId,
            fileExt: img.fileExt,
            fileName: img.fileName,
          }))
        );
        setGeneratedCarouselPdf(null); // Clear PDF when images are generated
        setPdfSignedUrl(""); // Clear PDF URL

        // Save all image cloudFiles to post
        const cloudFileIds = data.images.map((img) => img.id);
        onSaveCloudFiles(cloudFileIds);

        showToast(`${data.images.length} carousel images generated successfully!`, "success");
      }
    },
    onError: (error) => {
      showToast(`Failed to generate carousel: ${error.message}`, "error");
    },
  });

  // Parse carousel slides into structured format for renderer
  const parseCarouselSlides = () => {
    return carouselSlides.map((slideText) => {
      const lines = slideText.split("\n").filter((line) => line.trim());
      const slide: { heading?: string; subheading?: string; bullets?: string[] } = {};

      let currentSection: "heading" | "bullets" = "heading";
      const bullets: string[] = [];

      lines.forEach((line, index) => {
        const trimmed = line.trim();

        // First line is heading
        if (index === 0) {
          slide.heading = trimmed.replace(/^Slide \d+:\s*/, "");
        }
        // Lines starting with bullet points
        else if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
          currentSection = "bullets";
          bullets.push(trimmed.replace(/^[•\-*]\s*/, ""));
        }
        // Second line (if not a bullet) is subheading
        else if (index === 1 && currentSection === "heading") {
          slide.subheading = trimmed;
        }
        // Additional non-bullet lines go to bullets
        else if (trimmed.length > 0) {
          bullets.push(trimmed);
        }
      });

      if (bullets.length > 0) {
        slide.bullets = bullets;
      }

      return slide;
    });
  };

  const handleGenerateCarousel = (format: "images" | "pdf") => {
    const slides = parseCarouselSlides();
    generateCarouselMutation.mutate({
      slides,
      format,
    });
  };

  // Generate both images and pdf when requested
  const handleGenerateCarousellBoth = async () => {
    if (carouselSlides.length === 0) {
      showToast("Please add at least one slide to generate the carousel", "error");
      return;
    }

    setIsGeneratingCarousell(true);
    const slides = parseCarouselSlides();
    try {
      // generate images first
      if (generateCarouselMutation.mutateAsync) {
        await generateCarouselMutation.mutateAsync({ slides, format: "images" });
        // then generate pdf
        await generateCarouselMutation.mutateAsync({ slides, format: "pdf" });
      } else {
        // fallback in case mutateAsync is not available
        generateCarouselMutation.mutate({ slides, format: "images" });
        generateCarouselMutation.mutate({ slides, format: "pdf" });
      }
    } catch (err: any) {
      showToast(`Failed to generate carousel: ${err?.message || String(err)}`, "error");
    } finally {
      setIsGeneratingCarousell(false);
    }
  };

  // Get social accounts - single query for all accounts
  const { data: socialAccounts, isLoading: isSocialAccountsLoading } = trpc.viewer.socials.getSocialNetWorking.useQuery();

  // Derive LinkedIn, X, and Instagram account info from socialAccounts
  // Only search for accounts after loading is complete
  const linkedinAccount = !isSocialAccountsLoading && socialAccounts?.find(
    (account) => account.appId === "linkedin-social"
  );

  const xAccount = !isSocialAccountsLoading && socialAccounts?.find(
    (account) => account.appId === "xconsumerkeys-social"
  );

  const instagramAccount = !isSocialAccountsLoading && socialAccounts?.find(
    (account) => account.appId === "instagram-social"
  );

  // Check if accounts are connected (have credentials)
  // Use 'id' instead of 'credentialId' since that's what the backend returns
  // Don't show as "not connected" while still loading
  const hasLinkedinAccount = isSocialAccountsLoading ? false : !!linkedinAccount?.id;
  const hasXAccount = isSocialAccountsLoading ? false : !!xAccount?.id;
  const hasInstagramAccount = isSocialAccountsLoading ? false : !!instagramAccount?.id;

  const handleLinkedinPublish = async () => {
    if (!linkedinAccount) {
      showToast("Please connect a LinkedIn account first", "error");
      return;
    }

    if (!outputs.linkedin?.trim()) {
      showToast("Please generate LinkedIn content first", "error");
      return;
    }

    showToast("Publishing to LinkedIn...", "success");
    // TODO: Implement actual publishing logic
  };

  const handleLinkedinSchedule = () => {
    if (!linkedinAccount) {
      showToast("Please connect a LinkedIn account first", "error");
      return;
    }

    if (!outputs.linkedin?.trim()) {
      showToast("Please generate LinkedIn content first", "error");
      return;
    }

    setIsLinkedinScheduleOpen(true);
  };

  const handleLinkedinScheduleUpdate = async (pluginData?: PluginType) => {
    if (!linkedinScheduleDateTime) {
      showToast("Please select a date and time", "error");
      return;
    }

    if (!currentPostId) {
      showToast("Post ID is missing", "error");
      return;
    }

    try {
      showToast("Scheduling LinkedIn post...", "success");

      const response = await fetch("/api/posts/schedulePost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: currentPostId,
          scheduleDay: linkedinScheduleDateTime,
        }),
      });

      if (response.ok) {
        showToast("LinkedIn post scheduled successfully!", "success");
        setIsLinkedinScheduleOpen(false);
      } else {
        showToast("Failed to schedule LinkedIn post", "error");
      }
    } catch (err) {
      console.error("Schedule error:", err);
      showToast("Failed to schedule LinkedIn post", "error");
    }
  };

  const handleXPublish = async () => {
    if (!xAccount) {
      showToast("Please connect an X account first", "error");
      return;
    }

    if (!outputs.x?.trim() && xThreadItems.length === 0) {
      showToast("Please generate X content first", "error");
      return;
    }

    if (!currentPostId) {
      showToast("Please save the post first before publishing", "error");
      return;
    }

    try {
      showToast("Publishing to X...", "success");

      // If the user has thread items, call the postThread API which posts multiple tweets as a thread
      if (xThreadItems && xThreadItems.length > 0) {
        const resp = await fetch(`/api/integrations/xconsumerkeyssocial/postThread?id=${currentPostId}&credentialId=${xAccount.id}`, {
          method: "POST",
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
          showToast("Thread published to X", "success");
        } else {
          showToast(data.error || "Failed to publish thread to X", "error");
        }
      } else {
        // Fallback to single post
        const resp = await fetch(`/api/integrations/xconsumerkeyssocial/post?id=${currentPostId}&credentialId=${xAccount.id}`, {
          method: "POST",
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
          showToast("Posted to X", "success");
        } else {
          showToast(data.error || "Failed to post to X", "error");
        }
      }
    } catch (err) {
      showToast("Failed to publish to X", "error");
    }
  };

  const handleXSchedule = () => {
    if (!xAccount) {
      showToast("Please connect an X account first", "error");
      return;
    }

    if (!outputs.x?.trim() && xThreadItems.length === 0) {
      showToast("Please generate X content first", "error");
      return;
    }

    setIsXScheduleOpen(true);
  };

  const handleXScheduleUpdate = async (pluginData?: PluginType) => {
    if (!xScheduleDateTime) {
      showToast("Please select a date and time", "error");
      return;
    }

    if (!currentPostId) {
      showToast("Post ID is missing", "error");
      return;
    }

    try {
      showToast("Scheduling X post...", "success");

      const response = await fetch("/api/posts/schedulePost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: currentPostId,
          scheduleDay: xScheduleDateTime,
        }),
      });

      if (response.ok) {
        showToast("X post scheduled successfully!", "success");
        setIsXScheduleOpen(false);
      } else {
        showToast("Failed to schedule X post", "error");
      }
    } catch (err) {
      console.error("Schedule error:", err);
      showToast("Failed to schedule X post", "error");
    }
  };

  const handleLinkedinPdfSchedule = () => {
    if (!linkedinAccount) {
      showToast("Please connect a LinkedIn account first", "error");
      return;
    }

    if (!currentPostId) {
      showToast("Please save the post first before scheduling", "error");
      return;
    }

    if (!generatedCarouselPdf) {
      showToast("No PDF generated to schedule", "error");
      return;
    }

    setIsLinkedinPdfScheduleOpen(true);
  };

  const handleLinkedinPdfScheduleUpdate = async () => {
    if (!linkedinPdfScheduleDateTime) {
      showToast("Please select a date and time", "error");
      return;
    }

    if (!currentPostId) {
      showToast("Post ID is missing", "error");
      return;
    }

    try {
      showToast("Scheduling LinkedIn PDF...", "success");

      const response = await fetch("/api/posts/schedulePost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: currentPostId,
          scheduleDay: linkedinPdfScheduleDateTime,
        }),
      });

      if (response.ok) {
        showToast("PDF scheduled successfully!", "success");
        setIsLinkedinPdfScheduleOpen(false);
      } else {
        showToast("Failed to schedule PDF", "error");
      }
    } catch (err) {
      console.error("Schedule error:", err);
      showToast("Failed to schedule PDF", "error");
    }
  };

  const handleInstallLinkedIn = async () => {
    try {
      const response = await fetch("/api/integrations/linkedinsocial/add");
      const data = await response.json();
      if (data.url) {
        window.open(data.url, "_self");
      }
    } catch (error) {
      showToast("Failed to initiate LinkedIn installation", "error");
    }
  };

  const handleInstallX = async () => {
    try {
      const response = await fetch("/api/integrations/xconsumerkeyssocial/add");
      const data = await response.json();
      if (data.url) {
        window.open(data.url, "_self");
      }
    } catch (error) {
      showToast("Failed to initiate X installation", "error");
    }
  };

  const handleInstallInstagram = async () => {
    try {
      const response = await fetch("/api/integrations/instagramsocial/add");
      const data = await response.json();
      if (data.url) {
        window.open(data.url, "_self");
      }
    } catch (error) {
      showToast("Failed to initiate Instagram installation", "error");
    }
  };

  return (
    <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold mb-1">Outputs</h3>
        <p className="text-sm text-slate-500">Preview & tweak each format</p>
      </div>

      <div className="space-y-4">
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

        <div className="mt-4">
          {activeTab === "carousel" ? (
            <div className="space-y-3">
              {carouselSlides.map((slide, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold">{index + 1}</div>
                  <TextArea
                    className="flex-1 min-h-[100px] rounded-xl border-slate-200"
                    value={slide}
                    onChange={(e) => {
                      const newSlides = [...carouselSlides];
                      newSlides[index] = e.target.value;
                      setCarouselSlides(newSlides);
                      setOutputs({ ...outputs, carousel: newSlides.join("\n\n") });
                    }}
                    placeholder={`Slide ${index + 1}: Title\n\n• Point 1\n• Point 2\n• Point 3`}
                  />
                  <button
                    onClick={() => {
                      const newSlides = carouselSlides.filter((_, i) => i !== index);
                      setCarouselSlides(newSlides);
                      setOutputs({ ...outputs, carousel: newSlides.join("\n\n") });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button onClick={() => setCarouselSlides([...carouselSlides, `Slide ${carouselSlides.length + 1}: Title\n\n• Point 1\n• Point 2\n• Point 3`])} className="text-sm text-purple-600 hover:text-purple-800 font-medium">+ Add slide</button>

              {/* Carousel Generation Buttons */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Generate Carousel</h3>
                <div className="flex gap-3">
                  <Button
                    onClick={handleGenerateCarousellBoth}
                    loading={isGeneratingCarousell || generateCarouselMutation.isLoading}
                    disabled={carouselSlides.length === 0 || isGeneratingCarousell || generateCarouselMutation.isLoading}
                    className="px-4"
                    StartIcon={FileImage}
                  >
                    Generate Carousell
                  </Button>
                  {onSavePlatform && (
                    <Button
                      className="rounded-xl px-4 py-2"
                      color="primary"
                      onClick={() => onSavePlatform("x")}
                      size="sm"
                    >
                      Save
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Generate beautiful carousel images (1080×1350) for Instagram or a PDF for LinkedIn
                </p>
              </div>

              {/* Display Generated Carousel Images */}
              {generatedCarouselImages.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    Generated Carousel ({generatedCarouselImages.length} slides)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {generatedCarouselImages.map((image, index) => {
                      const signedUrl = imageSignedUrls[image.id];
                      return (
                        <div key={image.id} className="relative group">
                          <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full z-10">
                            {index + 1}
                          </div>
                          {signedUrl ? (
                            <img
                              src={signedUrl}
                              alt={`Carousel slide ${index + 1}`}
                              className="w-full h-auto rounded-lg border border-slate-200 shadow-sm"
                            />
                          ) : (
                            <div className="w-full aspect-[4/5] rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center">
                              <p className="text-slate-500 text-sm">Loading...</p>
                            </div>
                          )}
                          {signedUrl && (
                            <a
                              href={signedUrl}
                              download={image.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-slate-700 p-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Display Generated PDF */}
              {generatedCarouselPdf && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Generated PDF</h3>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 text-red-700 p-2 rounded">
                        <FileImage className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{generatedCarouselPdf.fileName}</p>
                        <p className="text-xs text-slate-500">Carousel PDF</p>
                      </div>
                    </div>
                    {pdfSignedUrl ? (
                      <div className="flex gap-2">
                        <a
                          href={pdfSignedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </a>
                        <a
                          href={pdfSignedUrl}
                          download={generatedCarouselPdf.fileName}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">Loading PDF...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "x" ? (
            <div className="space-y-3">
              {xThreadItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">{index + 1}</div>
                  <TextArea
                    className="flex-1 min-h-[80px] rounded-xl border-slate-200"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...xThreadItems];
                      newItems[index] = e.target.value;
                      setXThreadItems(newItems);
                      setOutputs({ ...outputs, x: newItems.map((t, i) => `${i + 1}/ ${t}`).join("\n\n") });
                    }}
                  />
                  <button
                    onClick={() => {
                      const newItems = xThreadItems.filter((_, i) => i !== index);
                      setXThreadItems(newItems);
                      setOutputs({ ...outputs, x: newItems.map((t, i) => `${i + 1}/ ${t}`).join("\n\n") });
                    }}
                    className="flex-shrink-0 text-red-500 hover:text-red-700 px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button onClick={() => setXThreadItems([...xThreadItems, ""]) } className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add tweet</button>
            </div>
          ) : activeTab === "blog" ? (
            <BlogMarkdownEditor value={outputs.blog} onChange={(value: string) => setOutputs({ ...outputs, blog: value })} placeholder="Write your blog post in markdown..." />
          ) : (
            <TextArea className="min-h-[300px] w-full rounded-xl border-slate-200" value={outputs[activeTab as keyof Outputs]} onChange={(e) => setOutputs({ ...outputs, [activeTab]: e.target.value } as Outputs)} />
          )}
        </div>

        <div className="border-t border-slate-200 my-4" />

        {/* Carousel-specific actions - Instagram & LinkedIn accounts */}
        {activeTab === "carousel" && (
          <div className="space-y-3 mb-4">
            {/* Instagram Account Section */}
            <div>
              {hasInstagramAccount && instagramAccount ? (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200 shadow-sm">
                  {/* Instagram Account Info */}
                  <SocialAvatar
                    avatarUrl={instagramAccount.avatarUrl || ""}
                    name={instagramAccount.name}
                    appId={instagramAccount.appId}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{instagramAccount.name}</p>
                    <p className="text-xs text-slate-600 truncate">{instagramAccount.emailOrUserName}</p>
                  </div>

                  {/* Publish & Schedule Buttons for Instagram */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      className="rounded-xl px-4 py-2"
                      onClick={() => showToast("Instagram publishing coming soon!", "success")}
                      StartIcon={Send}
                      disabled={generatedCarouselImages.length === 0}
                      size="sm"
                    >
                      Publish to IG
                    </Button>
                    <Button
                      className="rounded-xl px-4 py-2"
                      color="secondary"
                      onClick={() => showToast("Instagram scheduling coming soon!", "success")}
                      StartIcon={Calendar}
                      disabled={generatedCarouselImages.length === 0}
                      size="sm"
                    >
                      Schedule
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-pink-50 rounded-xl border border-pink-200">
                  <p className="text-sm text-slate-700">Connect Instagram to publish carousels</p>
                  <Button
                    color="secondary"
                    className="rounded-xl px-6"
                    onClick={handleInstallInstagram}
                  >
                    Connect Instagram
                  </Button>
                </div>
              )}
            </div>

            {/* LinkedIn Account Section for PDF */}
            <div>
              {hasLinkedinAccount && linkedinAccount ? (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                  {/* LinkedIn Account Info */}
                  <SocialAvatar
                    avatarUrl={linkedinAccount.avatarUrl || ""}
                    name={linkedinAccount.name}
                    appId={linkedinAccount.appId}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{linkedinAccount.name}</p>
                    <p className="text-xs text-slate-600 truncate">{linkedinAccount.emailOrUserName}</p>
                  </div>

                  {/* Publish & Schedule Buttons for LinkedIn PDF */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      className="rounded-xl px-4 py-2"
                      onClick={async () => {
                        if (!currentPostId) {
                          showToast("Please save the post first before publishing", "error");
                          return;
                        }
                        if (!generatedCarouselPdf) {
                          showToast("No PDF generated to publish", "error");
                          return;
                        }

                        // Derive title from first slide heading (fallbacks applied)
                        const slides = parseCarouselSlides();
                        const firstHeading = slides[0]?.heading || "";
                        const title = firstHeading || outputs.linkedin || "";

                        try {
                          showToast("Publishing PDF to LinkedIn...", "success");
                          const resp = await fetch(`/api/integrations/linkedinsocial/postPdf?id=${currentPostId}&title=${encodeURIComponent(title)}&credentialId=${linkedinAccount.id}`, {
                            method: "POST",
                          });
                          const data = await resp.json();
                          if (resp.ok && data.success) {
                            showToast("PDF published to LinkedIn", "success");
                          } else {
                            showToast("Failed to publish PDF to LinkedIn", "error");
                          }
                        } catch (err) {
                          showToast("Failed to publish PDF to LinkedIn", "error");
                        }
                      }}
                      StartIcon={Send}
                      disabled={!generatedCarouselPdf}
                      size="sm"
                    >
                      Publish PDF
                    </Button>
                    <Button
                      className="rounded-xl px-4 py-2"
                      color="secondary"
                      onClick={handleLinkedinPdfSchedule}
                      StartIcon={Calendar}
                      disabled={!generatedCarouselPdf}
                      size="sm"
                    >
                      Schedule
                    </Button>
                      {onSavePlatform && (
                        <Button
                          className="rounded-xl px-4 py-2"
                          color="primary"
                          onClick={() => onSavePlatform("carousel")}
                          size="sm"
                        >
                          Save
                        </Button>
                      )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-slate-700">Connect LinkedIn to publish carousel PDFs</p>
                  <Button
                    color="secondary"
                    className="rounded-xl px-6"
                    onClick={handleInstallLinkedIn}
                  >
                    Connect LinkedIn
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LinkedIn-specific actions */}
        {activeTab === "linkedin" && (
          <div className="mb-4">
            {hasLinkedinAccount && linkedinAccount ? (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                {/* LinkedIn Account Info */}
                <SocialAvatar
                  avatarUrl={linkedinAccount.avatarUrl || ""}
                  name={linkedinAccount.name}
                  appId={linkedinAccount.appId}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{linkedinAccount.name}</p>
                  <p className="text-xs text-slate-600 truncate">{linkedinAccount.emailOrUserName}</p>
                </div>

                {/* Publish & Schedule Buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    className="rounded-xl px-4 py-2"
                    onClick={handleLinkedinPublish}
                    StartIcon={Send}
                    disabled={!outputs.linkedin?.trim()}
                    size="sm"
                  >
                    Publish
                  </Button>
                  <Button
                    className="rounded-xl px-4 py-2"
                    color="secondary"
                    onClick={handleLinkedinSchedule}
                    StartIcon={Calendar}
                    disabled={!outputs.linkedin?.trim()}
                    size="sm"
                  >
                    Schedule
                  </Button>
                  {onSavePlatform && (
                    <Button
                      className="rounded-xl px-4 py-2"
                      color="primary"
                      onClick={() => onSavePlatform("linkedin")}
                      size="sm"
                    >
                      Save
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 text-center">
                <p className="text-sm text-slate-600 mb-3">Connect your LinkedIn account to publish posts</p>
                <Button
                  className="rounded-xl px-6"
                  onClick={handleInstallLinkedIn}
                >
                  Install LinkedIn
                </Button>
              </div>
            )}
          </div>
        )}

        {/* X-specific actions */}
        {activeTab === "x" && (
          <div className="mb-4">
            {hasXAccount && xAccount ? (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200 shadow-sm">
                {/* X Account Info */}
                <SocialAvatar
                  avatarUrl={xAccount.avatarUrl || ""}
                  name={xAccount.name}
                  appId={xAccount.appId}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{xAccount.name}</p>
                  <p className="text-xs text-slate-600 truncate">{xAccount.emailOrUserName}</p>
                </div>

                {/* Publish & Schedule Buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    className="rounded-xl px-4 py-2"
                    onClick={handleXPublish}
                    StartIcon={Send}
                    disabled={!outputs.x?.trim() && xThreadItems.length === 0}
                    size="sm"
                  >
                    Publish
                  </Button>
                  <Button
                    className="rounded-xl px-4 py-2"
                    color="secondary"
                    onClick={handleXSchedule}
                    StartIcon={Calendar}
                    disabled={!outputs.x?.trim() && xThreadItems.length === 0}
                    size="sm"
                  >
                    Schedule
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 text-center">
                <p className="text-sm text-slate-600 mb-3">Connect your X account to publish posts</p>
                <Button
                  className="rounded-xl px-6"
                  onClick={handleInstallX}
                >
                  Install X
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2 items-center">
            <Button
              className="rounded-xl"
              size="sm"
              color="minimal"
              onClick={async () => {
                // Select & Copy (attempt to copy rich HTML)
                const content = outputs[activeTab as keyof Outputs] || "";
                const html = renderMarkdownToHTML(content);
                try {
                  if (navigator.clipboard && (window as any).ClipboardItem) {
                    const blob = new Blob([html], { type: 'text/html' });
                    const clipboardItem = new (window as any).ClipboardItem({ 'text/html': blob });
                    await navigator.clipboard.write([clipboardItem]);
                    showToast('Content copied (HTML) - ready to paste into Medium', 'success');
                  } else {
                    await navigator.clipboard.writeText(html);
                    showToast('Content copied as HTML text', 'success');
                  }
                } catch (err) {
                  console.error('Select & Copy failed, copying plain text instead', err);
                  await navigator.clipboard.writeText(content);
                  showToast('Content copied as plain text', 'success');
                }
              }}
            >
              Select & Copy
            </Button>

            <Button
              className="rounded-xl"
              size="sm"
              color="minimal"
              onClick={async () => {
                // Copy markdown
                const content = outputs[activeTab as keyof Outputs] || "";
                try {
                  await navigator.clipboard.writeText(content);
                  showToast('Markdown copied to clipboard', 'success');
                } catch (err) {
                  console.error('Copy markdown failed', err);
                  showToast('Failed to copy markdown', 'error');
                }
              }}
            >
              Copy MD
            </Button>

            <Button
              className="rounded-xl"
              size="sm"
              color="minimal"
              onClick={async () => {
                // Copy HTML conversion
                const content = outputs[activeTab as keyof Outputs] || "";
                const html = renderMarkdownToHTML(content);
                try {
                  await navigator.clipboard.writeText(html);
                  showToast('HTML copied to clipboard', 'success');
                } catch (err) {
                  console.error('Copy HTML failed', err);
                  showToast('Failed to copy HTML', 'error');
                }
              }}
            >
              Copy HTML
            </Button>
            {onSavePlatform && (
              <Button
                className="rounded-xl"
                size="sm"
                color="primary"
                onClick={() => onSavePlatform(activeTab as any)}
              >
                Save
              </Button>
            )}
          </div>

          <Button className="rounded-xl" color="secondary" onClick={handleRegenerate} StartIcon={Wand} loading={regenerateLoading} disabled={regenerateLoading}>{regenerateLoading ? "Regenerating..." : "Regenerate"}</Button>
        </div>
      </div>

      {/* LinkedIn Schedule Dialog */}
      <ScheduleDialog
        open={isLinkedinScheduleOpen}
        onClose={() => setIsLinkedinScheduleOpen(false)}
        onDateTimeChange={(value: string) => setLinkedinScheduleDateTime(value)}
        onUpdate={handleLinkedinScheduleUpdate}
        appId="linkedin-social"
      />

      {/* LinkedIn PDF Schedule Dialog */}
      <ScheduleDialog
        open={isLinkedinPdfScheduleOpen}
        onClose={() => setIsLinkedinPdfScheduleOpen(false)}
        onDateTimeChange={(value: string) => setLinkedinPdfScheduleDateTime(value)}
        onUpdate={handleLinkedinPdfScheduleUpdate}
        appId="linkedin-social"
      />

      {/* X Schedule Dialog */}
      <ScheduleDialog
        open={isXScheduleOpen}
        onClose={() => setIsXScheduleOpen(false)}
        onDateTimeChange={(value: string) => setXScheduleDateTime(value)}
        onUpdate={handleXScheduleUpdate}
        appId="xconsumerkeys-social"
      />
    </div>
  );
};

export default OutputPanel;
