import { CadenceChannel, CadenceFormat, TargetPlatform } from "./types";

export const formatLegend: Record<CadenceFormat, string> = {
  text: "Text",
  thread: "Thread",
  carousel: "Carousel",
  shorts: "Shorts",
  blog: "Blog",
};

export const channelLabels: Record<CadenceChannel, string> = {
  linkedin: "LinkedIn",
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  blog: "Blog",
};

export const platformBadges: Record<TargetPlatform, { label: string; tone: string }> = {
  x: { label: "X", tone: "bg-slate-900 text-white" },
  linkedin: { label: "LinkedIn", tone: "bg-blue-100 text-blue-700" },
  youtube: { label: "YouTube", tone: "bg-red-100 text-red-600" },
  instagram: { label: "Instagram", tone: "bg-fuchsia-100 text-fuchsia-600" },
  rss: { label: "RSS", tone: "bg-amber-100 text-amber-700" },
  other: { label: "Other", tone: "bg-slate-100 text-slate-600" },
};

