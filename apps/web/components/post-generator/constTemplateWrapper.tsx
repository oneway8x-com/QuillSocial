import InputArticlePost from "./inputArticlePost";
import InputBookLearnings from "./inputBookLearnings";
import InputFavouriteTool from "./inputFavouriteTool";
import InputFormatContent from "./inputFormatContent";
import InputRecentLearning from "./inputRecentLearning";
import InputShareStruggle from "./inputShareStruggle";
import InputShareTips from "./inputShareTips";
import InputStartScratch from "./inputStartScratch";
import InputFeatureLaunch from "./inputFeatureLaunch";
import InputSneakPeek from "./inputSneakPeek";
import InputProblemSolution from "./inputProblemSolution";
import InputUserFeedback from "./inputUserFeedback";
import InputHowItWorks from "./inputHowItWorks";
import InputBeforeAfter from "./inputBeforeAfter";
import InputFounderVoice from "./inputFounderVoice";
import InputSmallMighty from "./inputSmallMighty";
import InputChangelog from "./inputChangelog";
import React from "react";

export interface InputData {
  countInput: number;
  input: { id: string; value: string; optional?: boolean }[];
}
export interface InputTemplateProps {
  onInputData?: (data: InputData) => void;
}

type InputTemplateComponent = React.FC<InputTemplateProps>;

const InputTemplateCustom: React.FC<{
  number: number;
  onInputData?: (data: InputData) => void;
}> = ({ number, onInputData }) => {
  const components: { [key: number]: InputTemplateComponent } = {
    1: InputFeatureLaunch,
    2: InputSneakPeek,
    3: InputProblemSolution,
    4: InputUserFeedback,
    5: InputHowItWorks,
    6: InputBeforeAfter,
    7: InputShareTips,
    8: InputFounderVoice,
    9: InputShareStruggle,
    10: InputSmallMighty,
    11: InputBookLearnings,
    12: InputRecentLearning,
    13: InputFavouriteTool,
    14: InputChangelog,
    15: InputStartScratch,
    16: InputArticlePost,
    17: InputFormatContent,
  };

  const SelectedInput = components[number] || InputStartScratch;

  return <SelectedInput onInputData={onInputData} />;
};
// Template Categories
export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const templateCategories: TemplateCategory[] = [
  {
    id: "launch",
    name: "🚀 Product Launch",
    description: "Announce features, updates, and new releases",
    icon: "🚀",
  },
  {
    id: "educational",
    name: "🧠 Educational",
    description: "How-to guides and tutorials",
    icon: "🧠",
  },
  {
    id: "narrative",
    name: "❤️ Story & Narrative",
    description: "Human stories and founder voice",
    icon: "❤️",
  },
  {
    id: "engagement",
    name: "💬 Engagement",
    description: "Share experiences and build community",
    icon: "💬",
  },
  {
    id: "general",
    name: "✨ General",
    description: "Versatile templates for any content",
    icon: "✨",
  },
];

export interface TemplateInfo {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  isNew: boolean;
  backgroundColor: string;
  category: string;
}

export const templatesInfo: TemplateInfo[] = [
  // 🚀 PRODUCT LAUNCH CATEGORY
  {
    id: 1,
    code: "feature-launch",
    title: "Feature Launch",
    subtitle: "Classic 'Now Live' announcement",
    description:
      "Launch your new feature with excitement. Perfect for announcing what's new and getting users to try it.",
    isNew: true,
    backgroundColor: "#94ecff",
    category: "launch",
  },
  {
    id: 2,
    code: "sneak-peek",
    title: "Sneak Peek / Beta",
    subtitle: "Build anticipation with early access",
    description:
      "Tease upcoming features and invite early users to beta test. Great for building anticipation.",
    isNew: true,
    backgroundColor: "#ffd6e7",
    category: "launch",
  },
  {
    id: 3,
    code: "problem-solution",
    title: "Problem → Solution",
    subtitle: "Show how you solve real problems",
    description:
      "Present a common pain point and show how your feature solves it with proof.",
    isNew: true,
    backgroundColor: "#c7f0bd",
    category: "launch",
  },
  {
    id: 4,
    code: "user-feedback",
    title: "Built from Feedback",
    subtitle: "Community-driven feature launch",
    description:
      "Celebrate user feedback and show how you listen. Perfect for community building.",
    isNew: true,
    backgroundColor: "#fff4cc",
    category: "launch",
  },

  // 🧠 EDUCATIONAL CATEGORY
  {
    id: 5,
    code: "how-it-works",
    title: "How It Works",
    subtitle: "Step-by-step mini guide",
    description:
      "Break down complex features into 3 simple steps. Help users get started quickly.",
    isNew: true,
    backgroundColor: "#e8d5f2",
    category: "educational",
  },
  {
    id: 6,
    code: "before-after",
    title: "Before & After",
    subtitle: "Show the transformation",
    description:
      "Highlight the difference your product makes. Show old way vs new way with metrics.",
    isNew: true,
    backgroundColor: "#ffd9b3",
    category: "educational",
  },
  {
    id: 7,
    code: "valuable-tips",
    title: "Share Valuable Tips",
    subtitle: "Share tips on your topic",
    description:
      "Share the tips on your topic of interest and let AI create a post for you.",
    isNew: false,
    backgroundColor: "#90ee90",
    category: "educational",
  },

  // ❤️ STORY & NARRATIVE CATEGORY
  {
    id: 8,
    code: "founder-voice",
    title: "Founder Voice",
    subtitle: "Share your why and vision",
    description:
      "Tell the story behind your product. Connect with your audience on a personal level.",
    isNew: true,
    backgroundColor: "#ffb3ba",
    category: "narrative",
  },
  {
    id: 9,
    code: "struggle",
    title: "Share Your Struggle",
    subtitle: "Be vulnerable and authentic",
    description:
      "Share the details of your recent struggle and let AI create a relatable post for you.",
    isNew: false,
    backgroundColor: "#ffcc99",
    category: "narrative",
  },
  {
    id: 10,
    code: "small-mighty",
    title: "Small but Mighty",
    subtitle: "Celebrate micro-updates",
    description:
      "Highlight small improvements that make a big difference. Show attention to detail.",
    isNew: true,
    backgroundColor: "#b5e7a0",
    category: "narrative",
  },

  // 💬 ENGAGEMENT CATEGORY
  {
    id: 11,
    code: "book-learning",
    title: "Share Book Learnings",
    subtitle: "Share insights from books",
    description:
      "Share the learnings from a book and let AI create an engaging post for you.",
    isNew: false,
    backgroundColor: "#87ceeb",
    category: "engagement",
  },
  {
    id: 12,
    code: "recent-learning",
    title: "Share Recent Learning",
    subtitle: "What you learned recently",
    description:
      "Share the details of your recent learning and let AI create a post for you.",
    isNew: false,
    backgroundColor: "#fac49d",
    category: "engagement",
  },
  {
    id: 13,
    code: "favourite-tool",
    title: "Share Favorite Tool",
    subtitle: "Recommend tools you love",
    description:
      "Share the details of your favorite tool and let AI create a post for you.",
    isNew: false,
    backgroundColor: "#add8e6",
    category: "engagement",
  },
  {
    id: 14,
    code: "changelog",
    title: "Weekly Changelog",
    subtitle: "Friendly update summary",
    description:
      "Share what's new, improved, and fixed this week. Keep your community updated.",
    isNew: true,
    backgroundColor: "#d4f1f4",
    category: "engagement",
  },

  // ✨ GENERAL CATEGORY
  {
    id: 15,
    code: "from-scratch",
    title: "Start from Scratch",
    subtitle: "Generate post from scratch",
    description:
      "Use the power of AI-generated content to create impactful posts on any topic.",
    isNew: false,
    backgroundColor: "#94ecff",
    category: "general",
  },
  {
    id: 16,
    code: "from-article",
    title: "Article to Post",
    subtitle: "Convert articles to posts",
    description: "Share a link to a blog post and generate an engaging post from it.",
    isNew: false,
    backgroundColor: "#fffbb5",
    category: "general",
  },
  {
    id: 17,
    code: "format-content",
    title: "Format Your Content",
    subtitle: "Polish your existing content",
    description:
      "Use the power of AI to format your clunky content into readable, engaging posts.",
    isNew: false,
    backgroundColor: "#f0e68c",
    category: "general",
  },
];

export const emotionsStartScratch = [
  { id: 1, name: "Excited", icon: "😃" },
  { id: 2, name: "Professional", icon: "💼" },
  { id: 3, name: "Encouraging", icon: "💪" },
  { id: 4, name: "Funny", icon: "😄" },
  { id: 5, name: "Dramatic", icon: "🎭" },
  { id: 6, name: "Candid", icon: "📸" },
  { id: 7, name: "Casual", icon: "👕" },
  { id: 8, name: "Convincing", icon: "🤝" },
  { id: 9, name: "Urgent", icon: "⏰" },
  { id: 10, name: "Engaging", icon: "💡" },
  { id: 11, name: "Creative", icon: "🎨" },
  { id: 12, name: "Worried", icon: "😟" },
  { id: 13, name: "Passionate", icon: "❤️" },
  { id: 14, name: "Informative", icon: "📚" },
];
export const getIdFromCode = (code: string) => {
  const template = templatesInfo.find((template) => template.code === code);
  return template ? template.id : -1;
};
export default InputTemplateCustom;
