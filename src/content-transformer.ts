import { marked } from 'marked';

import { ContentTransformer } from './sdk-types';

type ContentTransformerOptions = {
  markdown2Html?: boolean;
  transformResponseContent?: ContentTransformer;
};

const identityTransformer: ContentTransformer = (text) => text;

export function createContentTransformer(options: ContentTransformerOptions): ContentTransformer {
  const { markdown2Html, transformResponseContent } = options;

  if (transformResponseContent) {
    return transformResponseContent;
  }

  if (markdown2Html) {
    return (text: string) => marked(text) as string;
  }

  return identityTransformer;
}
