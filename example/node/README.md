# Node.js Test Environment

This directory contains examples and test scripts for running the `openai-apis` library in a Node.js environment.

## Prerequisites

1.  Build the project:
    ```bash
    npm run build
    ```
2.  Create a `.env` file in the project root (copy from `.env.example`) and add your `OPENAI_API_KEY`.

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
