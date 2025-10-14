import { BasePostGenerator } from "../base-generator";

/**
 * Feature Launch Post Generator
 * Single Responsibility: Only handles feature launch post generation
 * Liskov Substitution: Can be used anywhere BasePostGenerator is expected
 */
export class FeatureLaunchGenerator extends BasePostGenerator {
  protected buildInstruction(args: any[], format?: string): string {
    const [featureName, userBenefit, useCase, ctaLink] = args.slice(0, 4);

    const baseInstruction = this.createFeatureLaunchInstruction(
      this.getStringValue(featureName),
      this.getStringValue(userBenefit),
      this.getStringValue(useCase),
      this.getStringValue(ctaLink)
    );

    return this.buildFormatInstruction(baseInstruction, format);
  }

  private createFeatureLaunchInstruction(
    featureName: string,
    userBenefit: string,
    useCase: string,
    ctaLink: string
  ): string {
    const useCaseText = useCase ? `Here's a use case example: "${useCase}".` : "";
    const ctaText = ctaLink ? `Include this call-to-action link: ${ctaLink}.` : "";

    return `Write an exciting product launch announcement for a new feature called "${featureName}". The feature provides this benefit: "${userBenefit}". ${useCaseText} ${ctaText} Use an excited, professional tone with emojis. Make it engaging and encourage users to try it. Structure it like:

🎉 Now Live: [Feature Name]

You asked, we built it.
→ [What it does]
→ [Why it matters]

Try it today → [link]

#ProductUpdate #Launch #BuildInPublic`;
  }
}

// Factory function for backward compatibility
export const generateFeatureLaunch = async (
  userId: number,
  featureName: string,
  userBenefit: string,
  useCase: string,
  ctaLink: string,
  format?: string
) => {
  const generator = new FeatureLaunchGenerator();
  return await generator.generate(userId, featureName, userBenefit, useCase, ctaLink, format);
};
