# openai-apis

一个轻量级、类型安全且功能强大的 OpenAI 接口封装库。支持 Node.js 和浏览器环境，内置流式响应（Streaming）、上下文对话管理和 Token 计算功能。

[![npm version](https://img.shields.io/npm/v/openai-apis.svg)](https://www.npmjs.com/package/openai-apis)
[![license](https://img.shields.io/npm/l/openai-apis.svg)](https://github.com/xcy960815/openai-apis/blob/main/LICENSE)

## ✨ 特性

- 🚀 **简单易用**：开箱即用，API 设计直观。
- 🌊 **流式响应**：完美支持 Server-Sent Events (SSE)，实时获取 AI 回复。
- 🧠 **上下文管理**：自动维护对话历史，轻松实现多轮对话。
- 🔢 **Token 计算**：内置 Token 计算器，自动管理上下文长度，防止超额。
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

## 🚀 快速开始

### 1. 基础对话 (GptModel)

适用于 GPT-3.5-turbo, GPT-4 等聊天模型。

```typescript
import { GptModel } from 'openai-apis';

const gpt = new GptModel({
  apiKey: 'your-api-key', // 你的 OpenAI API Key
  debug: true, // 开启调试模式
});

async function main() {
  const res = await gpt.getAnswer('你好，请介绍一下你自己');
  console.log(res.content);
}

main();
```

### 2. 流式响应 (Streaming)

实时获取输出，体验更流畅。

```typescript
import { GptModel } from 'openai-apis';

const gpt = new GptModel({
  apiKey: 'your-api-key',
});

gpt.getAnswer('写一首关于春天的诗', {
  onProgress: (partialResponse) => {
    console.log('Stream:', partialResponse.content);
  }
}).then((finalResponse) => {
  console.log('Done:', finalResponse.content);
});
```

### 3. 多轮对话 (上下文保持)

通过传递 `parentMessageId` 来保持对话上下文。

```typescript
import { GptModel } from 'openai-apis';

const gpt = new GptModel({ apiKey: '...' });

async function chat() {
  // 第一轮
  const res1 = await gpt.getAnswer('我叫小明');
  console.log('AI:', res1.content);

  // 第二轮 (传入上一条消息的 ID)
  const res2 = await gpt.getAnswer('我叫什么名字？', {
    parentMessageId: res1.messageId
  });
  console.log('AI:', res2.content); // AI 会回答：你叫小明
}
```

## ⚙️ 配置参数

### 初始化参数 (CoreOptions)

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `apiKey` | `string` | - | **必填**。OpenAI API Key |
| `apiBaseUrl` | `string` | `https://api.openai.com` | API 基础地址，可配置代理地址 |
| `debug` | `boolean` | `false` | 是否开启调试日志 |
| `systemMessage` | `string` | (默认提示词) | 系统预设角色/提示词 |
| `maxModelTokens` | `number` | `4096` | 模型最大 Token 数 |
| `maxResponseTokens` | `number` | `1000` | 回复最大 Token 数 |
| `milliseconds` | `number` | `60000` | 请求超时时间 (毫秒) |

### 请求参数 (GetAnswerOptions)

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `parentMessageId` | `string` | 上一条消息的 ID，用于关联上下文 |
| `stream` | `boolean` | 是否开启流式传输 (配置 `onProgress` 时自动为 true) |
| `onProgress` | `function` | 流式响应回调函数 |
| `systemMessage` | `string` | 覆盖当前对话的系统提示词 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT
