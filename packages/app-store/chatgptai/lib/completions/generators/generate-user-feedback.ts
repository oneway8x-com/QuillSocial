import {
  getChatCompletions,
  getRewriteCompletions,
} from "../getChatCompletions";

const getMessageTexts = (
  featureName: string,
  feedbackExample: string,
  improvement: string,
  gratitude: string,
  format?: string
) => {
  const instruction = format
    ? `Write a community-driven feature announcement for "${featureName}". ${feedbackExample ? `User feedback: "${feedbackExample}".` : ""} Improvement: "${improvement}". ${gratitude ? `Gratitude message: "${gratitude}".` : ""} Show appreciation for community input. Then transfer the paragraph into the pre-defined format as below:
    ${format}.
    Remove opening and closing curly brace`
    : `Write a community-driven feature announcement for "${featureName}". ${feedbackExample ? `User feedback: "${feedbackExample}".` : ""} Improvement: "${improvement}". ${gratitude ? `Gratitude message: "${gratitude}".` : ""} Show appreciation for community input. Structure it like:

💬 You asked for it — and we delivered!

[Feature Name] is here to [benefit].

Big thanks to everyone who shared feedback — your ideas help us build a better product.

Keep it coming 👇
#CommunityDriven #FeatureUpdate`;
  return instruction;
};

export const generateUserFeedback = async (
  userId: number,
  featureName: string,
  feedbackExample: string,
  improvement: string,
  gratitude: string,
  format?: string
) => {
  const { chatCompletion: post } = await getRewriteCompletions(
    userId,
    getMessageTexts(featureName, feedbackExample, improvement, gratitude, format)
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
