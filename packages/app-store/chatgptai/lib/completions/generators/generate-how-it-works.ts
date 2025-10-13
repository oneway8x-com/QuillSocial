import {
  getChatCompletions,
  getRewriteCompletions,
} from "../getChatCompletions";

const getMessageTexts = (
  featureName: string,
  step1: string,
  step2: string,
  step3: string,
  proTip: string,
  format?: string
) => {
  const instruction = format
    ? `Write a step-by-step "How It Works" guide for "${featureName}". Step 1: "${step1}". Step 2: "${step2}". Step 3: "${step3}". ${proTip ? `Pro tip: "${proTip}".` : ""} Make it clear and easy to follow. Then transfer the paragraph into the pre-defined format as below:
    ${format}.
    Remove opening and closing curly brace`
    : `Write a step-by-step "How It Works" guide for "${featureName}". Step 1: "${step1}". Step 2: "${step2}". Step 3: "${step3}". ${proTip ? `Pro tip: "${proTip}".` : ""} Make it clear and easy to follow. Structure it like:

🚀 New: [Feature Name]

Here's how to use it in 3 steps:
1️⃣ [Step 1]
2️⃣ [Step 2]
3️⃣ [Step 3]

${proTip ? `Pro tip: [${proTip}]` : ""}

#HowTo #ProductUpdate #BuildInPublic`;
  return instruction;
};

export const generateHowItWorks = async (
  userId: number,
  featureName: string,
  step1: string,
  step2: string,
  step3: string,
  proTip: string,
  format?: string
) => {
  const { chatCompletion: post } = await getRewriteCompletions(
    userId,
    getMessageTexts(featureName, step1, step2, step3, proTip, format)
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
