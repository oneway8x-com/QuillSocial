import {
  getChatCompletions,
  getRewriteCompletions,
} from "../getChatCompletions";

const getMessageTexts = (
  problem: string,
  featureName: string,
  solution: string,
  proofMetric: string,
  link: string,
  format?: string
) => {
  const instruction = format
    ? `Write a post that shows Problem → Solution → Proof. Problem: "${problem}". Solution: Feature called "${featureName}" that "${solution}". ${proofMetric ? `Proof/metric: "${proofMetric}".` : ""} ${link ? `Link: ${link}.` : ""} Make it clear and compelling. Then transfer the paragraph into the pre-defined format as below:
    ${format}.
    Remove opening and closing curly brace`
    : `Write a post that shows Problem → Solution → Proof. Problem: "${problem}". Solution: Feature called "${featureName}" that "${solution}". ${proofMetric ? `Proof/metric: "${proofMetric}".` : ""} ${link ? `Link: ${link}.` : ""} Make it clear and compelling. Structure it like:

❌ [Problem]
✅ Meet [Feature Name] — [Solution]

[How it fixes the issue]
${proofMetric ? `[Proof: "${proofMetric}"]` : ""}

Try it out: [link]
#ProductLaunch #BuildInPublic #FeatureDrop`;
  return instruction;
};

export const generateProblemSolution = async (
  userId: number,
  problem: string,
  featureName: string,
  solution: string,
  proofMetric: string,
  link: string,
  format?: string
) => {
  const { chatCompletion: post } = await getRewriteCompletions(
    userId,
    getMessageTexts(problem, featureName, solution, proofMetric, link, format)
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
