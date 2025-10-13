import {
  getChatCompletions,
  getRewriteCompletions,
} from "../getChatCompletions";

const getMessageTexts = (
  featureName: string,
  valueProposition: string,
  limitedAccess: string,
  betaLink: string,
  format?: string
) => {
  const instruction = format
    ? `Write a teaser post for an upcoming beta feature called "${featureName}". Value proposition: "${valueProposition}". ${limitedAccess ? `Limited access note: "${limitedAccess}".` : ""} ${betaLink ? `Beta signup link: ${betaLink}.` : ""} Create excitement and FOMO. Encourage engagement (likes, comments). Then transfer the paragraph into the pre-defined format as below:
    ${format}.
    Remove opening and closing curly brace`
    : `Write a teaser post for an upcoming beta feature called "${featureName}". Value proposition: "${valueProposition}". ${limitedAccess ? `Limited access note: "${limitedAccess}".` : ""} ${betaLink ? `Beta signup link: ${betaLink}.` : ""} Create excitement and FOMO. Encourage engagement (likes, comments). Structure it like:

👀 Sneak peek! We're testing something new: [Feature Name]

Designed to help you [value proposition].
We're inviting the first [X] users to try it early.

Drop a 🔥 or comment "beta" below to get access.

#BetaLaunch #StartupLife #AItools`;
  return instruction;
};

export const generateSneakPeek = async (
  userId: number,
  featureName: string,
  valueProposition: string,
  limitedAccess: string,
  betaLink: string,
  format?: string
) => {
  const { chatCompletion: post } = await getRewriteCompletions(
    userId,
    getMessageTexts(featureName, valueProposition, limitedAccess, betaLink, format)
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
