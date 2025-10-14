import { getRewriteCompletions } from "../getChatCompletions";

/**
 * Base interface for all post generators
 * Single Responsibility: Each generator handles one type of post
 * Open/Closed: Open for extension, closed for modification
 */
export interface IPostGenerator {
  generate(userId: number, ...args: any[]): Promise<GeneratorResponse>;
}

export interface GeneratorResponse {
  tokens: any[];
  post: string;
}

/**
 * Abstract base class implementing common logic
 * Template Method Pattern: Defines the skeleton of generation
 */
export abstract class BasePostGenerator implements IPostGenerator {
  /**
   * Template method - defines the generation flow
   */
  async generate(userId: number, ...args: any[]): Promise<GeneratorResponse> {
    const format = this.extractFormat(args);
    const instruction = this.buildInstruction(args, format);

    return await this.executeGeneration(userId, instruction);
  }

  /**
   * Abstract method - subclasses must implement
   */
  protected abstract buildInstruction(args: any[], format?: string): string;

  /**
   * Extract format from arguments (typically the last argument)
   */
  protected extractFormat(args: any[]): string | undefined {
    const lastArg = args[args.length - 1];
    return typeof lastArg === 'string' && this.isFormat(lastArg) ? lastArg : undefined;
  }

  /**
   * Check if argument is a format string
   */
  protected isFormat(arg: any): boolean {
    // Format strings typically contain HTML/template markers
    return typeof arg === 'string' && (
      arg.includes('pre-defined format') ||
      arg.length > 200 ||
      !arg.trim()
    );
  }

  /**
   * Common execution logic
   */
  protected async executeGeneration(
    userId: number,
    instruction: string
  ): Promise<GeneratorResponse> {
    const { chatCompletion: post } = await getRewriteCompletions(userId, instruction);

    let statusContent: string | undefined = "";
    const tokens: any[] = [];

    if (post?.choices && post.choices.length > 0) {
      statusContent = post.choices[0]?.message?.content || "";
      tokens.push(post.usage);
    }

    return {
      tokens,
      post: statusContent.replace(/['"]/g, ""),
    };
  }

  /**
   * Helper to build format instruction
   */
  protected buildFormatInstruction(baseInstruction: string, format?: string): string {
    if (format) {
      return `${baseInstruction} Then transfer the paragraph into the pre-defined format as below:
    ${format}.
    Remove opening and closing curly brace`;
    }
    return baseInstruction;
  }

  /**
   * Helper to safely get string value
   */
  protected getStringValue(value: any, defaultValue: string = ""): string {
    return value && typeof value === 'string' ? value : defaultValue;
  }
}

/**
 * Generator Registry - Dependency Inversion Principle
 * Depends on abstractions (IPostGenerator) not concrete implementations
 */
export class GeneratorRegistry {
  private generators: Map<number, IPostGenerator> = new Map();

  register(templateId: number, generator: IPostGenerator): void {
    this.generators.set(templateId, generator);
  }

  get(templateId: number): IPostGenerator | undefined {
    return this.generators.get(templateId);
  }

  has(templateId: number): boolean {
    return this.generators.has(templateId);
  }
}
