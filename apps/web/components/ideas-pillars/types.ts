export interface Idea {
  id: string;
  title: string;
  pillar: string;
  status: "Raw" | "Outlined";
  tags: string[];
}

export interface Outline {
  id: string;
  ideaId: string;
  text: string;
  metadata: {
    tone: "friendly" | "authoritative" | "contrarian";
  };
}

export type Tone = "friendly" | "authoritative" | "contrarian";
