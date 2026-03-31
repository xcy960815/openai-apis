import { Tiktoken } from 'js-tiktoken/lite';
import cl100kBase from 'js-tiktoken/ranks/cl100k_base';
import o200kBase from 'js-tiktoken/ranks/o200k_base';

import { TokenCountOptions, TokenCounter } from './sdk-types';

const O200K_MODEL_PATTERNS = [/^gpt-5/i, /^gpt-4o/i, /^gpt-4\.1/i, /^o[1-9]/i];

export class JsTiktokenTokenCounter implements TokenCounter {
  private readonly cl100kTokenizer = new Tiktoken(cl100kBase);
  private readonly o200kTokenizer = new Tiktoken(o200kBase);

  public async count(text: string, options?: TokenCountOptions): Promise<number> {
    return this.getTokenizer(options?.model).encode(text).length;
  }

  private getTokenizer(model?: string): Tiktoken {
    const normalizedModel = model?.trim().toLowerCase();

    if (!normalizedModel) {
      return this.o200kTokenizer;
    }

    if (O200K_MODEL_PATTERNS.some((pattern) => pattern.test(normalizedModel))) {
      return this.o200kTokenizer;
    }

    return this.cl100kTokenizer;
  }
}

/**
 * @deprecated Use `JsTiktokenTokenCounter` instead.
 */
export class Gpt3TokenizerTokenCounter extends JsTiktokenTokenCounter {}
