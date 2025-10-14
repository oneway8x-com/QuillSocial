import {
  getChatCompletions,
  getRewriteCompletions,
} from "../getChatCompletions";

const getMessageTexts = (
  featureName: string,
  userBenefit: string,
  useCase: string,
  ctaLink: string,
  format?: string
) => {
  const instruction = format
    ? `Write an exciting product launch announcement for a new feature called "${featureName}". The feature provides this benefit: "${userBenefit}". ${useCase ? `Here's a use case example: "${useCase}".` : ""} ${ctaLink ? `Include this call-to-action link: ${ctaLink}.` : ""} Use an excited, professional tone with emojis. Make it engaging and encourage users to try it. Then transfer the paragraph into the pre-defined format as below:
    ${format}.
    Remove opening and closing curly brace`
    : `Write an exciting product launch announcement for a new feature called "${featureName}". The feature provides this benefit: "${userBenefit}". ${useCase ? `Here's a use case example: "${useCase}".` : ""} ${ctaLink ? `Include this call-to-action link: ${ctaLink}.` : ""} Use an excited, professional tone with emojis. Make it engaging and encourage users to try it. Structure it like:

🎉 Now Live: [Feature Name]

You asked, we built it.
→ [What it does]
→ [Why it matters]

Try it today → [link]

#ProductUpdate #Launch #BuildInPublic`;
  return instruction;
};

export const generateFeatureLaunch = async (
  userId: number,
  featureName: string,
  userBenefit: string,
  useCase: string,
  ctaLink: string,
  format?: string
) => {
  const { chatCompletion: post } = await getRewriteCompletions(
    userId,
    getMessageTexts(featureName, userBenefit, useCase, ctaLink, format)
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
