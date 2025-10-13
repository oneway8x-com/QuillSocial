import {
  getChatCompletions,
  getRewriteCompletions,
} from "../getChatCompletions";

const getMessageTexts = (
  featureName: string,
  whyBuilt: string,
  problemInspired: string,
  futureVision: string,
  format?: string
) => {
  const instruction = format
    ? `Write a founder's voice post about "${featureName}". Why you built it: "${whyBuilt}". ${problemInspired ? `Problem that inspired it: "${problemInspired}".` : ""} ${futureVision ? `Future vision: "${futureVision}".` : ""} Be authentic, personal, and inspiring. Then transfer the paragraph into the pre-defined format as below:
    ${format}.
    Remove opening and closing curly brace`
    : `Write a founder's voice post about "${featureName}". Why you built it: "${whyBuilt}". ${problemInspired ? `Problem that inspired it: "${problemInspired}".` : ""} ${futureVision ? `Future vision: "${futureVision}".` : ""} Be authentic, personal, and inspiring. Structure it like:

We built [Feature Name] because [story/why].

It's now live!

Our goal: [target outcome/vision]

Excited to hear what you think 👇
#BuildInPublic #StartupJourney`;
  return instruction;
};

export const generateFounderVoice = async (
  userId: number,
  featureName: string,
  whyBuilt: string,
  problemInspired: string,
  futureVision: string,
  format?: string
) => {
  const { chatCompletion: post } = await getRewriteCompletions(
    userId,
    getMessageTexts(featureName, whyBuilt, problemInspired, futureVision, format)
  );

  let statusContent: string | undefined = "";

  const tokens: (any | undefined)[] = [];
  if (post && post.choices && post.choices.length > 0) {
    statusContent = post?.choices[0]?.message?.content!;
    tokens.push(post.usage);
  }
  return {
    tokens,
    post: statusContent.replace(/['"]/g, ""),
  };
};
