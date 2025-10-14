import { getIdFromCode } from "@components/post-generator/constTemplateWrapper";
import { generateBookLearning } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-book-learning";
import { generateFavouriteTool } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-favourite-tool";
import { generateFormatContent } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-format-content";
import { generateFromArticle } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-from-article";
import { generateFromScratch } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-from-scratch";
import { generateRecentLearning } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-recent-learning";
import { generateStruggle } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-struggle";
import { generateValuableTips } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-valuable-tips";
// New template generators
import { generateFeatureLaunch } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-feature-launch";
import { generateSneakPeek } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-sneak-peek";
import { generateProblemSolution } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-problem-solution";
import { generateUserFeedback } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-user-feedback";
import { generateHowItWorks } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-how-it-works";
import { generateBeforeAfter } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-before-after";
import { generateFounderVoice } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-founder-voice";
import { generateSmallMighty } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-small-mighty";
import { generateChangelog } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-changelog";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { defaultResponder } from "@quillsocial/lib/server";
import * as cheerio from "cheerio";
import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

interface RequestInput {
  code: string;
  format?: string;
  inputs: {
    countInput: number;
    input: { id: string; value: string; optional?: boolean }[];
  };
}
interface Generators {
  [key: number]: (...args: any[]) => Promise<any>;
}

/**
 * Generator mapping following the template ID structure:
 * 1: Feature Launch
 * 2: Sneak Peek / Beta
 * 3: Problem → Solution
 * 4: Built from Feedback
 * 5: How It Works
 * 6: Before & After
 * 7: Share Valuable Tips
 * 8: Founder Voice
 * 9: Share Your Struggle
 * 10: Small but Mighty
 * 11: Share Book Learnings
 * 12: Share Recent Learning
 * 13: Share Favorite Tool
 * 14: Weekly Changelog
 * 15: Start from Scratch
 * 16: Article to Post
 * 17: Format Your Content
 */
const generators: Generators = {
  1: generateFeatureLaunch,      // Feature Launch
  2: generateSneakPeek,          // Sneak Peek / Beta
  3: generateProblemSolution,    // Problem → Solution
  4: generateUserFeedback,       // Built from Feedback
  5: generateHowItWorks,         // How It Works
  6: generateBeforeAfter,        // Before & After
  7: generateValuableTips,       // Share Valuable Tips
  8: generateFounderVoice,       // Founder Voice
  9: generateStruggle,           // Share Your Struggle
  10: generateSmallMighty,       // Small but Mighty
  11: generateBookLearning,      // Share Book Learnings
  12: generateRecentLearning,    // Share Recent Learning
  13: generateFavouriteTool,     // Share Favorite Tool
  14: generateChangelog,         // Weekly Changelog
  15: generateFromScratch,       // Start from Scratch
  16: generateFromArticle,       // Article to Post
  17: generateFormatContent,     // Format Your Content
};

async function handler(
  req: NextApiRequest & { userId?: number },
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }
  const session = await getServerSession({ req, res });
  if (!session?.user?.id) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { code, format, inputs } = req.body as RequestInput;
  const numId = getIdFromCode(code);

  const isValidInputs = inputs.input.every(
    (item) => item.optional || (item.value !== null && item.value !== "")
  );

  if (!isValidInputs) {
    res.status(400).json({ message: "Invalid inputs" });
    return;
  }

  if (!numId || numId === -1) {
    res.status(400).json({ message: "Invalid code" });
    return;
  }

  // Special handling for Article to Post template
  if (code === "from-article") {
    const url = inputs.input.find((x) => x.id === "url")?.value;
    const instructions = inputs.input.find(
      (x) => x.id === "instructions"
    )?.value;
    if (!url || !isValidUrl(url)) {
      res.status(400).json({ message: "Invalid url" });
      return;
    }
    const webContent = await fetchTextContent(url!);
    const result = await generateFromArticle(
      session?.user?.id!,
      url,
      instructions ?? "",
      webContent,
      format ? format : undefined
    );
    // Extract post content from result (generators return { tokens, post })
    const postContent = typeof result === 'string' ? result : result.post;
    res.status(200).json({ post: postContent });
    return;
  }

  // Handle all other templates through the generator registry
  const generatorFunc = generators[numId];
  if (generatorFunc) {
    const valuesInput = inputs.input.map((input) => input.value || "");
    const result = await generatorFunc(
      session?.user?.id!,
      ...valuesInput,
      format ? format : undefined
    );
    // Extract post content from result (generators return { tokens, post })
    const postContent = typeof result === 'string' ? result : result.post;
    res.status(200).json({ post: postContent });
    return;
  } else {
    console.error(`No generator found for template ID: ${numId}`);
    res.status(400).json({ message: "Invalid template ID" });
    return;
  }
}

async function fetchTextContent(url: string): Promise<string> {
  // Fetch the HTML content from the URL
  const response = await fetch(url);
  const html = await response.text();

  // Load the HTML into cheerio
  const $ = cheerio.load(html);

  // Extract and return the raw text, removing all HTML tags
  return $("body").text();
}

function isValidUrl(urlString: string): boolean {
  const urlPattern = new RegExp(
    "^(https?:\\/\\/)?" + // validate protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name and extension
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!urlPattern.test(urlString);
}

export default defaultResponder(handler);
