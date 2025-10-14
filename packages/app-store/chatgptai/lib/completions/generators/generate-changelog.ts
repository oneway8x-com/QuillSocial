import {
  getChatCompletions,
  getRewriteCompletions,
} from "../getChatCompletions";

const getMessageTexts = (
  productName: string,
  newFeature: string,
  improved: string,
  fixed: string,
  behindScenes: string,
  changelogLink: string,
  format?: string
) => {
  const instruction = format
    ? `Write a friendly weekly changelog for "${productName}". ${newFeature ? `New: "${newFeature}".` : ""} ${improved ? `Improved: "${improved}".` : ""} ${fixed ? `Fixed: "${fixed}".` : ""} ${behindScenes ? `Behind-the-scenes: "${behindScenes}".` : ""} ${changelogLink ? `Link: ${changelogLink}.` : ""} Keep it friendly and engaging. Then transfer the paragraph into the pre-defined format as below:
    ${format}.
    Remove opening and closing curly brace`
    : `Write a friendly weekly changelog for "${productName}". ${newFeature ? `New: "${newFeature}".` : ""} ${improved ? `Improved: "${improved}".` : ""} ${fixed ? `Fixed: "${fixed}".` : ""} ${behindScenes ? `Behind-the-scenes: "${behindScenes}".` : ""} ${changelogLink ? `Link: ${changelogLink}.` : ""} Keep it friendly and engaging. Structure it like:

🧠 What's new this week in [Product Name]:

${newFeature ? `• New: [Feature]` : ""}
${improved ? `• Improved: [Feature]` : ""}
${fixed ? `• Fixed: [Issue]` : ""}

${behindScenes ? `[Behind-the-scenes note]` : "The team's working hard to keep things smooth and fast"} 🚀
${changelogLink ? `Full changelog → [link]` : ""}
#ProductUpdate`;
  return instruction;
};

export const generateChangelog = async (
  userId: number,
  productName: string,
  newFeature: string,
  improved: string,
  fixed: string,
  behindScenes: string,
  changelogLink: string,
  format?: string
) => {
  const { chatCompletion: post } = await getRewriteCompletions(
    userId,
    getMessageTexts(productName, newFeature, improved, fixed, behindScenes, changelogLink, format)
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
