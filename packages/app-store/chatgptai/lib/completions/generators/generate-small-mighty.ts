import {
  getChatCompletions,
  getRewriteCompletions,
} from "../getChatCompletions";

const getMessageTexts = (
  featureName: string,
  tweak: string,
  benefit: string,
  format?: string
) => {
  const instruction = format
    ? `Write a "Small but Mighty" post about a micro-improvement. Feature/tweak: "${featureName}". What changed: "${tweak}". Why it matters: "${benefit}". Celebrate attention to detail. Then transfer the paragraph into the pre-defined format as below:
    ${format}.
    Remove opening and closing curly brace`
    : `Write a "Small but Mighty" post about a micro-improvement. Feature/tweak: "${featureName}". What changed: "${tweak}". Why it matters: "${benefit}". Celebrate attention to detail. Structure it like:

✨ Small but mighty: [Feature/Tweak Name]

It may look tiny, but it [benefit].

One more step towards making our product simpler every day.
#ProductDesign #Usability`;
  return instruction;
};

export const generateSmallMighty = async (
  userId: number,
  featureName: string,
  tweak: string,
  benefit: string,
  format?: string
) => {
  const { chatCompletion: post } = await getRewriteCompletions(
    userId,
    getMessageTexts(featureName, tweak, benefit, format)
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
