# openai-apis

一个轻量级、类型安全且功能强大的 OpenAI-compatible Chat Completions SDK。支持 Node.js 和浏览器环境，内置流式响应（Streaming）、可插拔上下文管理、工具调用（Tool Calling）和 Token 计算功能。

[![npm version](https://img.shields.io/npm/v/openai-apis.svg)](https://www.npmjs.com/package/openai-apis)
[![license](https://img.shields.io/npm/l/openai-apis.svg)](https://github.com/xcy960815/openai-apis/blob/main/LICENSE)
[![CI](https://github.com/xcy960815/openai-apis/actions/workflows/ci.yml/badge.svg)](https://github.com/xcy960815/openai-apis/actions/workflows/ci.yml)

## ✨ 特性

- 🚀 **简单易用**：开箱即用，API 设计直观，统一了不同模型的调用方式。
- 🌊 **流式响应**：完美支持 Server-Sent Events (SSE)，实时获取 AI 回复，体验丝滑。
- 🧠 **上下文管理**：支持可插拔的会话存储，可按需开启多轮对话，而不是把状态硬编码进客户端实例。
- 🔌 **多模型支持**：支持 OpenAI 以及兼容 OpenAI 协议的模型（如 **DeepSeek**）。
- 🛠️ **工具调用**：支持 `tools` / `tool_choice`，并正确回传 `role: 'tool'` 的结果消息。
- 📝 **Markdown 转 HTML**：内置 Markdown 解析器，可配置直接输出 HTML 格式。
- 🔢 **Token 计算**：内置基于 `js-tiktoken` 的 Token 计算器，并按模型选择更合适的编码做近似估算。
- 🌐 **多端支持**：同时支持 Node.js (14+) 和 浏览器环境。
- 📘 **TypeScript**：提供完整的类型定义，开发体验极佳。

## 📦 安装

```bash
npm install openai-apis
# 或者
pnpm add openai-apis
# 或者
yarn add openai-apis
```

## 🔐 示例环境变量

仓库里的 Node 示例和浏览器示例共用根目录 `.env`，变量名保持一致：

```bash
cp .env.example .env
```

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_API_BASE_URL=https://api.openai.com
OPENAI_MODEL=gpt-5-mini
```

- `OPENAI_API_KEY`：必填
- `OPENAI_API_BASE_URL`：推荐填写；浏览器示例和工具调用示例都会读取它
- `OPENAI_MODEL`：可选，不填时默认使用 `gpt-5-mini`

## 🚀 快速开始

### 1. 基础对话 (OpenAI)

```typescript
import { ChatClient } from 'openai-apis';

const client = new ChatClient({
  apiKey: 'your-openai-api-key',
  // 也可以传 baseURL，且支持是否自带 /v1
  // baseURL: 'https://api.openai.com',
  requestParams: {
    model: 'gpt-5-mini',
  }
});

async function main() {
  const res = await client.sendMessage('你好，请介绍一下你自己');
  console.log(res.content); 
}

main();
```

### 2. 使用 DeepSeek 模型

本库完美支持 DeepSeek 等兼容 OpenAI 接口的模型。

```typescript
import { ChatClient } from 'openai-apis';

const client = new ChatClient({
  apiKey: 'your-deepseek-api-key',
  apiBaseUrl: 'https://api.deepseek.com', // 设置 DeepSeek 的 API 地址
  requestParams: {
    model: 'deepseek-chat', // 指定模型
  }
});

async function main() {
  const res = await client.sendMessage('DeepSeek 是什么？');
  console.log(res.content);
}
```

### 3. 流式响应 (Streaming)

实时获取输出，体验更流畅。

```typescript
client.sendMessage('写一首关于春天的诗', {
  onProgress: (partialResponse) => {
    // partialResponse.content 包含当前累积的回复内容
    console.log('Stream:', partialResponse.content);
  }
}).then((finalResponse) => {
  console.log('Done:', finalResponse.content);
});
```

### 4. 多轮对话 (上下文保持)

通过传递 `parentMessageId` 来保持对话上下文。为了让 SDK 记住历史消息，需要显式提供一个会话存储：

```typescript
import { ChatClient, InMemoryConversationStore } from 'openai-apis';

const client = new ChatClient({
  apiKey: 'your-openai-api-key',
  conversationStore: new InMemoryConversationStore(),
  requestParams: {
    model: 'gpt-5-mini',
  }
});

async function chat() {
  // 第一轮
  const res1 = await client.sendMessage('我叫小明');
  console.log('AI:', res1.content);

  // 第二轮 (传入上一条消息的 ID)
  const res2 = await client.sendMessage('我叫什么名字？', {
    parentMessageId: res1.messageId
  });
  console.log('AI:', res2.content); // AI 会回答：你叫小明
}
```

## ⚙️ 配置参数

### 初始化参数 (ChatClientOptions)

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `apiKey` | `string` | - | **必填**。API Key |
| `apiBaseUrl` | `string` | `https://api.openai.com` | API 基础地址，支持 DeepSeek 等第三方服务 |
| `baseURL` | `string` | - | `apiBaseUrl` 的别名，便于与官方 SDK 配置保持一致 |
| `requestParams` | `object` | `{ model: 'gpt-5-mini' }` | 默认请求参数，可设置 `model`, `temperature`, `reasoning_effort`, `verbosity`, `response_format`, `parallel_tool_calls` 等 |
| `debug` | `boolean` | `false` | 是否开启调试日志 |
| `markdown2Html` | `boolean` | `false` | 是否将 Markdown 转换为 HTML |
| `transformResponseContent` | `function` | - | 自定义响应内容转换器 |
| `conversationStore` | `ConversationStore` | - | 显式提供会话存储；不传时客户端默认无状态 |
| `withContent` | `boolean` | `false` | 兼容旧用法，传 `true` 时自动使用默认内存存储 |
| `tokenCounter` | `TokenCounter` | - | 自定义 Token 计数实现 |
| `transport` | `OpenAITransport` | - | 自定义 OpenAI-compatible 传输实现 |
| `systemMessage` | `string` | - | 系统预设角色/提示词；不传则不会自动注入默认系统消息 |
| `maxResponseTokens` | `number` | `1000` | 回复最大 Token 数 |
| `milliseconds` | `number` | `60000` | 请求超时时间 (毫秒) |

### 请求参数 (sendMessage 第二个参数)

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `parentMessageId` | `string` | 上一条消息的 ID，用于关联上下文 |
| `onProgress` | `function` | 流式响应回调函数 |
| `systemMessage` | `string` | 覆盖当前对话的系统提示词 |
| `role` | `string` | 当前发送消息的角色，支持 `user` / `assistant` / `system` / `tool` / `function` |
| `requestParams` | `object` | 覆盖初始化的请求参数 (如临时切换模型) |

## 🛠️ Tool Calling 示例

```typescript
import { ChatClient, InMemoryConversationStore } from 'openai-apis';

const client = new ChatClient({
  apiKey: 'your-openai-api-key',
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
              location: { type: 'string' }
            },
            required: ['location']
          }
        }
      }
    ],
    tool_choice: 'auto'
  }
});

if (res1.tool_calls?.length) {
  const toolCall = res1.tool_calls[0];
  const toolResult = JSON.stringify({ location: 'Shanghai', temperature: 22 });

  const res2 = await client.sendMessage(toolResult, {
    parentMessageId: res1.messageId,
    role: 'tool',
    tool_call_id: toolCall.id,
    name: toolCall.function.name,
  });

  console.log(res2.content);
}
```

## 📌 说明

- 本库聚焦 OpenAI-compatible 的 Chat Completions 接口，适合同时对接 OpenAI 和其他兼容服务。
- 如果你只面向 OpenAI 官方并准备采用更新的 Responses API，优先考虑官方 SDK；本库更偏向轻量、兼容、易嵌入的封装方式。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

MIT
