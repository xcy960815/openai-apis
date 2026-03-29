# Node.js Test Environment

This directory contains examples and test scripts for running the `openai-apis` library in a Node.js environment.

## Prerequisites

1.  Build the project:
    ```bash
    npm run build
    ```
2.  Create a root `.env` file by copying `.env.example`.
3.  Fill in these environment variables in the project root `.env`:
    ```bash
    OPENAI_API_KEY=your_api_key_here
    OPENAI_API_BASE_URL=https://api.openai.com
    OPENAI_MODEL=gpt-5-mini
    ```

All Node examples in this directory read the same root `.env` file. `OPENAI_API_BASE_URL` is optional for the basic/CLI examples but recommended so every example uses the same endpoint configuration.

## Scripts

### Run Basic Test
Runs a simple script that tests non-streaming and streaming responses.
```bash
npm run example:node
```

### Run Interactive CLI
Starts an interactive command-line interface where you can chat with the AI.
```bash
npm run example:node:cli
```

### Run Function Calling Example
Demonstrates how to use OpenAI Function Calling (Tools). This example requires both `OPENAI_API_KEY` and `OPENAI_API_BASE_URL` to be set in the root `.env`.
```bash
npm run example:node:fc
```
