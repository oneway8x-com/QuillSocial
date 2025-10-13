/**
 * Central export point for all post generators
 * Makes imports cleaner and provides better organization
 */

// Original generators
export { generateFromScratch } from "./generate-from-scratch";
export { generateFromArticle } from "./generate-from-article";
export { generateBookLearning } from "./generate-book-learning";
export { generateValuableTips } from "./generate-valuable-tips";
export { generateRecentLearning } from "./generate-recent-learning";
export { generateFavouriteTool } from "./generate-favourite-tool";
export { generateStruggle } from "./generate-struggle";
export { generateFormatContent } from "./generate-format-content";

// New template generators
export { generateFeatureLaunch } from "./generate-feature-launch";
export { generateSneakPeek } from "./generate-sneak-peek";
export { generateProblemSolution } from "./generate-problem-solution";
export { generateUserFeedback } from "./generate-user-feedback";
export { generateHowItWorks } from "./generate-how-it-works";
export { generateBeforeAfter } from "./generate-before-after";
export { generateFounderVoice } from "./generate-founder-voice";
export { generateSmallMighty } from "./generate-small-mighty";
export { generateChangelog } from "./generate-changelog";

// Base classes for refactoring
export { BasePostGenerator, GeneratorRegistry } from "./base-generator";
export type { IPostGenerator, GeneratorResponse } from "./base-generator";
