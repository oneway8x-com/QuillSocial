import React, { useState } from "react";
import { useRouter } from "next/router";
import PageWrapper from "@components/PageWrapper";
import Shell from "@quillsocial/features/shell/Shell";
import { HeadSeo, Button, TextArea, showToast } from "@quillsocial/ui";
import {
  PenTool,
  CalendarDays,
  Copy,
  Save,
  Wand
} from "@quillsocial/ui/components/icon";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";

interface Tab {
  id: string;
  name: string;
}

const PostFactoryPage: React.FC & { PageWrapper?: any } = () => {
  const { t } = useLocale();
  const router = useRouter();

  const [outline, setOutline] = useState("Hook, 3 lessons on pricing ladder, example, CTA to pricing checklist");
  const [tone, setTone] = useState("authoritative");
  const [activeTab, setActiveTab] = useState("linkedin");
  const [cta, setCta] = useState("Join the pricing checklist");
  const [utm, setUtm] = useState("?utm_source=li&utm_medium=post");

  const [outputs, setOutputs] = useState({
    linkedin: `Most founders raise prices wrong. Here's the ladder we use:
1) Keep entry low friction
2) Add mid-tier with transformation
3) Anchor with premium service
CTA: ${cta}`,
    x: `1/ Pricing is a product.
2/ Ladder your value, not just your price.
3/ Examples...`,
    carousel: "",
    shorts: `Hook (5s): Most founders price backwards.
3 bullets (30s): Ladder, Transform, Anchor.
Proof (15s): Client cut churn 18%.
CTA (10s): Grab the free pricing checklist.`,
    blog: `# The Pricing Ladder Playbook

**Big claim:** Pricing is a product.

**Why it matters:** ...

**3 Insights:** ...

**Playbook:** ...

**CTA:** ${cta}`,
  });

  const tabs: Tab[] = [
    { id: "linkedin", name: "LinkedIn" },
    { id: "x", name: "X Thread" },
    { id: "carousel", name: "IG Carousel" },
    { id: "shorts", name: "Shorts" },
    { id: "blog", name: "Blog" },
  ];

  const handleGenerateAll = () => {
    // TODO: Integrate with AI generation
    console.log("Generating content for all platforms...");
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
    // TODO: Regenerate content for current tab
    console.log(`Regenerating content for ${activeTab}...`);
    showToast("Regenerating content...", "success");
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
              onClick={handleSchedule}
            >
              {t("Save Draft")}
            </Button>
            <Button
              StartIcon={CalendarDays}
              onClick={handleSchedule}
            >
              {t("Schedule Now")}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-semibold mb-1">Input</h3>
              <p className="text-sm text-slate-500">Outline</p>
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
                  <label className="text-sm text-slate-600 font-medium block mb-2">Tone</label>
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
                  <label className="text-sm text-slate-600 font-medium block mb-2">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium">
                      LinkedIn
                    </button>
                    <button className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium">
                      X
                    </button>
                    <button className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium">
                      Instagram
                    </button>
                    <button className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium">
                      YouTube
                    </button>
                    <button className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium">
                      Blog
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full rounded-xl"
                  onClick={handleGenerateAll}
                  StartIcon={Wand}
                >
                  Generate All
                </Button>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-semibold mb-1">Outputs</h3>
              <p className="text-sm text-slate-500">Preview & tweak each format</p>
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
              <div className="min-h-[300px]">
                {activeTab === "carousel" ? (
                  <div className="grid grid-cols-5 gap-2">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="p-3 border rounded-xl bg-slate-50 min-h-[90px] text-sm flex items-center justify-center"
                      >
                        Slide {i + 1}
                      </div>
                    ))}
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
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Shell>
    </>
  );
};PostFactoryPage.PageWrapper = PageWrapper;

export default PostFactoryPage;
