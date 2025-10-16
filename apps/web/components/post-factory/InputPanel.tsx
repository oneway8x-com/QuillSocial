import React from "react";
import { TextArea, Button } from "@quillsocial/ui";
import { Wand } from "@quillsocial/ui/components/icon";

type Props = {
  outline: string;
  setOutline: (v: string) => void;
  tone: "friendly" | "authoritative" | "contrarian";
  setTone: (t: "friendly" | "authoritative" | "contrarian") => void;
  selectedPlatforms: ("linkedin" | "x" | "carousel" | "shorts" | "blog")[];
  togglePlatform: (p: "linkedin" | "x" | "carousel" | "shorts" | "blog") => void;
  handleGenerateAll: () => void;
  generateLoading: boolean;
  cta: string;
  setCta: (v: string) => void;
  utm: string;
  setUtm: (v: string) => void;
};

const InputPanel: React.FC<Props> = ({
  outline,
  setOutline,
  tone,
  setTone,
  selectedPlatforms,
  togglePlatform,
  handleGenerateAll,
  generateLoading,
  cta,
  setCta,
  utm,
  setUtm,
}) => {
  return (
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
          loading={generateLoading}
          disabled={generateLoading}
        >
          {generateLoading
            ? "Generating all..."
            : selectedPlatforms.length > 1
            ? "Generate all platforms"
            : "Generate all"}
        </Button>
      </div>

      <div className="space-y-4">
        <TextArea
          className="min-h-[200px] w-full rounded-xl border-slate-200"
          value={outline}
          onChange={(e) => setOutline(e.target.value)}
          rows={16}
          placeholder="Hook, 3 bullets, example, CTA"
        />

        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-600 font-medium block mb-2">Tone</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTone("friendly")}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                  tone === "friendly" ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-700"
                }`}
              >
                Friendly
              </button>
              <button
                onClick={() => setTone("authoritative")}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                  tone === "authoritative" ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-700"
                }`}
              >
                Authoritative
              </button>
              <button
                onClick={() => setTone("contrarian")}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                  tone === "contrarian" ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-700"
                }`}
              >
                Contrarian
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 font-medium block mb-2">Platforms</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => togglePlatform("linkedin")} className={`px-3 py-1.5 rounded-xl text-sm font-medium ${selectedPlatforms.includes("linkedin") ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-700"}`}>
                LinkedIn
              </button>
              <button onClick={() => togglePlatform("x")} className={`px-3 py-1.5 rounded-xl text-sm font-medium ${selectedPlatforms.includes("x") ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-700"}`}>
                X
              </button>
              <button onClick={() => togglePlatform("carousel")} className={`px-3 py-1.5 rounded-xl text-sm font-medium ${selectedPlatforms.includes("carousel") ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-700"}`}>
                Instagram
              </button>
              <button onClick={() => togglePlatform("shorts")} className={`px-3 py-1.5 rounded-xl text-sm font-medium ${selectedPlatforms.includes("shorts") ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-700"}`}>
                YouTube
              </button>
              <button onClick={() => togglePlatform("blog")} className={`px-3 py-1.5 rounded-xl text-sm font-medium ${selectedPlatforms.includes("blog") ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-700"}`}>
                Blog
              </button>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">CTA</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="Join the pricing checklist"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">UTM</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  value={utm}
                  onChange={(e) => setUtm(e.target.value)}
                  placeholder="?utm_source=li&utm_medium=post"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputPanel;
