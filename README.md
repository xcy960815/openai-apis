# openai-apis

一个轻量、类型安全、面向 OpenAI-compatible 服务的 Chat Completions SDK，适用于 Node.js 和浏览器。

[![npm version](https://img.shields.io/npm/v/openai-apis.svg)](https://www.npmjs.com/package/openai-apis)
[![license](https://img.shields.io/npm/l/openai-apis.svg)](https://github.com/xcy960815/openai-apis/blob/main/LICENSE)
[![CI](https://github.com/xcy960815/openai-apis/actions/workflows/ci.yml/badge.svg)](https://github.com/xcy960815/openai-apis/actions/workflows/ci.yml)

## 特性

- 支持 OpenAI 以及兼容 OpenAI 协议的服务
- 支持普通响应和流式响应（SSE）
- 支持工具调用（`tools` / `tool_choice`）
- 显式的会话存储设计，默认无状态，按需开启多轮对话
- 可插拔的传输层、Token 计算器、响应内容转换器
- 内置 `js-tiktoken` Token 估算实现
- 提供完整 TypeScript 类型定义

## 安装

```bash
npm install openai-apis
```

```bash
pnpm add openai-apis
```

```bash
yarn add openai-apis
```

## 示例环境变量

仓库里的示例默认读取根目录 `.env`：

```bash
cp .env.example .env
```

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_API_BASE_URL=https://api.openai.com
OPENAI_MODEL=gpt-5-mini
```

- `OPENAI_API_KEY`：必填
- `OPENAI_API_BASE_URL`：可选，支持 OpenAI-compatible 网关，可传带 `/v1` 或不带 `/v1` 的地址
- `OPENAI_MODEL`：可选，示例默认使用 `gpt-5-mini`

## 快速开始

### 基础调用

```ts
import { ChatClient } from 'openai-apis';

const client = new ChatClient({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_API_BASE_URL,
  requestParams: {
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
  },
});

async function main() {
  const res = await client.sendMessage('你好，请介绍一下你自己');
  console.log(res.content);
}

main();
```

### 流式响应

```ts
const res = await client.sendMessage('写一首关于春天的短诗', {
  onProgress(partial) {
    console.log(partial.content);
  },
});

console.log(res.content);
```

### 多轮对话

SDK 默认不保存历史消息；需要多轮对话时，显式传入会话存储：

```ts
import { ChatClient, InMemoryConversationStore } from 'openai-apis';

const client = new ChatClient({
  apiKey: process.env.OPENAI_API_KEY!,
  conversationStore: new InMemoryConversationStore(),
  requestParams: {
    model: 'gpt-5-mini',
  },
});

async function chat() {
  const res1 = await client.sendMessage('我叫小明');
  const res2 = await client.sendMessage('我叫什么名字？', {
    parentMessageId: res1.messageId,
  });

  console.log(res2.content);
}
```

### Tool Calling

```ts
import { ChatClient, InMemoryConversationStore } from 'openai-apis';

const client = new ChatClient({
  apiKey: process.env.OPENAI_API_KEY!,
  conversationStore: new InMemoryConversationStore(),
});

const res1 = await client.sendMessage('上海天气怎么样？', {
  requestParams: {
    model: 'gpt-5-mini',
    tools: [
      {
        type: 'function',
        function: {
          name: 'get_current_weather',
          description: 'Get the current weather in a given location',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string' },
            },
            required: ['location'],
          },
        },
      },
    ],
    tool_choice: 'auto',
  },
});

if (res1.tool_calls?.length) {
  const toolCall = res1.tool_calls[0];
  const toolResult = JSON.stringify({
    location: 'Shanghai',
    temperature: 22,
  });

  const res2 = await client.sendMessage(toolResult, {
    parentMessageId: res1.messageId,
    role: 'tool',
    tool_call_id: toolCall.id,
    name: toolCall.function.name,
  });

  console.log(res2.content);
}
```

## 核心架构

当前源码按职责拆分成几块清晰的运行时组件：

| 模块 | 作用 |
| --- | --- |
| `ChatClient` | 面向业务的主入口，封装 Chat Completions 请求与响应 |
| `ClientCore` | 公共运行时能力，负责超时控制、会话拼装、上下文读取、内容转换 |
| `FetchOpenAITransport` | 默认传输层，负责普通 HTTP 请求和流式 SSE 消费 |
| `InMemoryConversationStore` | 默认内存会话存储实现 |
| `JsTiktokenTokenCounter` | 基于 `js-tiktoken` 的 Token 估算实现 |
| `sdk-types.ts` | 对外类型定义汇总 |

当前 `src/` 目录命名和职责是一一对应的：

```text
src/
  chat-client.ts
  client-core.ts
  fetch-openai-transport.ts
  in-memory-conversation-store.ts
  js-tiktoken-token-counter.ts
  sdk-types.ts
  chatgpt-error.ts
  content-transformer.ts
  index.ts
```

兼容性方面保留了两个旧名称导出：

- `ClientBase` 仍然可用，作为 `ClientCore` 的兼容别名
- `Gpt3TokenizerTokenCounter` 仍然可用，作为 `JsTiktokenTokenCounter` 的兼容别名

## 配置项

### `ChatClientOptions`

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `apiKey` | `string` | - | 必填，API Key |
| `apiBaseUrl` | `string` | `https://api.openai.com` | OpenAI-compatible 服务地址，支持传带 `/v1` 或不带 `/v1` 的地址 |
| `baseURL` | `string` | - | `apiBaseUrl` 的别名 |
| `requestParams` | `object` | `{ model: 'gpt-5-mini' }` | 默认请求参数 |
| `conversationStore` | `ConversationStore` \| `false` | `false` | 会话存储，不传则默认无状态 |
| `withContent` | `boolean` | `false` | 兼容旧用法，传 `true` 时启用默认内存会话存储 |
| `tokenCounter` | `TokenCounter` | - | 自定义 Token 计算实现 |
| `transport` | `OpenAITransport` | - | 自定义传输实现 |
| `systemMessage` | `string` | - | 默认系统提示词 |
| `markdown2Html` | `boolean` | `false` | 兼容旧用法，将 Markdown 转成 HTML |
| `transformResponseContent` | `(text) => string` | - | 自定义响应内容转换 |
| `maxModelTokens` | `number` | `4096` | 用于上下文裁剪的模型总 Token 上限 |
| `maxResponseTokens` | `number` | `1000` | 单次回复最大 Token |
| `milliseconds` | `number` | `60000` | 请求超时时间 |
| `debug` | `boolean` | `false` | 是否输出调试日志 |

### `sendMessage(question, options)`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `parentMessageId` | `string` | 指定上一条消息，启用上下文串联 |
| `onProgress` | `(partial) => void` | 流式输出回调 |
| `stream` | `boolean` | 显式控制是否使用流式 |
| `systemMessage` | `string` | 覆盖本次请求的系统提示词 |
| `role` | `Role` | 本次发送消息角色，支持 `user` / `assistant` / `system` / `tool` / `function` |
| `tool_call_id` | `string` | 工具消息对应的工具调用 ID |
| `name` | `string` | 工具名或函数名 |
| `requestParams` | `object` | 覆盖初始化时的请求参数 |

## 自定义扩展

### 自定义传输层

如果你有自己的请求适配器，可以实现 `OpenAITransport`：

```ts
import type { FetchRequestInit, OpenAITransport } from 'openai-apis';

class CustomTransport implements OpenAITransport {
  async request(path: string, requestInit: FetchRequestInit, abortSignal: AbortSignal) {
    return fetch(`https://your-proxy.example.com${path}`, {
      ...requestInit,
      signal: abortSignal,
    });
  }
}
```

### 自定义 Token 计算器

```ts
import type { TokenCounter } from 'openai-apis';

class CustomTokenCounter implements TokenCounter {
  async count(text: string) {
    return text.length;
  }
}
```

## 本地开发

推荐 Node.js 18+。

```bash
pnpm install
pnpm build
pnpm test --runInBand
pnpm lint
```

常用示例命令：

```bash
pnpm example:node
pnpm example:node:cli
pnpm example:node:fc
pnpm dev
```

## 构建产物

发布产物包括三部分：

- `dist/index.esm.js`
- `dist/index.cjs.js`
- `types/index.d.ts`

当前类型构建链为：

1. TypeScript 先把声明文件输出到临时目录 `temp/`
2. Rollup 使用 `rollup-plugin-dts` 将入口声明打包为 `types/index.d.ts`
3. 构建结束后清理 `temp/`

这套方式比单独维护 `api-extractor.json` 更轻，和当前 Rollup 构建链也更一致。

## 适用边界

- 这个库聚焦 OpenAI-compatible 的 Chat Completions 接口
- 如果你的项目只面向 OpenAI 官方、并准备全面切到 Responses API，优先考虑官方 SDK
- 如果你需要一个更轻、可插拔、方便接第三方兼容网关的封装，这个库更合适

## 贡献

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建分支：`git checkout -b feature/your-feature`
3. 提交修改：`git commit -m "feat: your feature"`
4. 推送分支：`git push origin feature/your-feature`
5. 发起 Pull Request

## License

MIT
