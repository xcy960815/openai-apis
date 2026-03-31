declare module 'js-tiktoken/ranks/cl100k_base' {
  const encoder: {
    pat_str: string;
    special_tokens: Record<string, number>;
    bpe_ranks: string;
  };

  export default encoder;
}

declare module 'js-tiktoken/ranks/o200k_base' {
  const encoder: {
    pat_str: string;
    special_tokens: Record<string, number>;
    bpe_ranks: string;
  };

  export default encoder;
}
