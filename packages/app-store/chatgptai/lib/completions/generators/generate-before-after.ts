import {
  getChatCompletions,
  getRewriteCompletions,
} from "../getChatCompletions";

const getMessageTexts = (
  oldWay: string,
  featureName: string,
  newWay: string,
  metric: string,
  link: string,
  format?: string
) => {
  const instruction = format
    ? `Write a Before & After comparison post. Before (old way): "${oldWay}". After: "${featureName}" makes it: "${newWay}". ${metric ? `Metric/time saved: "${metric}".` : ""} ${link ? `Link: ${link}.` : ""} Show clear transformation. Then transfer the paragraph into the pre-defined format as below:
    ${format}.
    Remove opening and closing curly brace`
    : `Write a Before & After comparison post. Before (old way): "${oldWay}". After: "${featureName}" makes it: "${newWay}". ${metric ? `Metric/time saved: "${metric}".` : ""} ${link ? `Link: ${link}.` : ""} Show clear transformation. Structure it like:

Before: [Old way pain point]
After: [Feature Name] [New way benefit]

${metric ? `⚡ ${metric}` : ""}

See the difference → [link]

#Automation #AItools #ProductUpdate`;
  return instruction;
};

export const generateBeforeAfter = async (
  userId: number,
  oldWay: string,
  featureName: string,
  newWay: string,
  metric: string,
  link: string,
  format?: string
) => {
  const { chatCompletion: post } = await getRewriteCompletions(
    userId,
    getMessageTexts(oldWay, featureName, newWay, metric, link, format)
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
