# openai-apis

一个轻量级、类型安全且功能强大的 LLM (OpenAI/DeepSeek) 接口封装库。支持 Node.js 和浏览器环境，内置流式响应（Streaming）、上下文对话管理和 Token 计算功能。

[![npm version](https://img.shields.io/npm/v/openai-apis.svg)](https://www.npmjs.com/package/openai-apis)
[![license](https://img.shields.io/npm/l/openai-apis.svg)](https://github.com/xcy960815/openai-apis/blob/main/LICENSE)
[![CI](https://github.com/xcy960815/openai-apis/actions/workflows/ci.yml/badge.svg)](https://github.com/xcy960815/openai-apis/actions/workflows/ci.yml)

## ✨ 特性

- 🚀 **简单易用**：开箱即用，API 设计直观，统一了不同模型的调用方式。
- 🌊 **流式响应**：完美支持 Server-Sent Events (SSE)，实时获取 AI 回复，体验丝滑。
- 🧠 **上下文管理**：自动维护对话历史，轻松实现多轮对话，无需手动拼接消息。
- 🔌 **多模型支持**：支持 OpenAI (GPT-3.5/4) 以及兼容 OpenAI 协议的模型（如 **DeepSeek**）。
- 📝 **Markdown 转 HTML**：内置 Markdown 解析器，可配置直接输出 HTML 格式。
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

### 1. 基础对话 (OpenAI)

```typescript
import { ChatClient } from 'openai-apis';

const client = new ChatClient({
  apiKey: 'your-openai-api-key',
  // apiBaseUrl: 'https://api.openai.com', // 默认为 OpenAI 官方地址
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

通过传递 `parentMessageId` 来保持对话上下文。

```typescript
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
| `requestParams` | `object` | `{ model: 'gpt-3.5-turbo' }` | 默认请求参数，可设置 `model`, `temperature` 等 |
| `debug` | `boolean` | `false` | 是否开启调试日志 |
| `markdown2Html` | `boolean` | `false` | 是否将 Markdown 转换为 HTML |
| `systemMessage` | `string` | (默认提示词) | 系统预设角色/提示词 |
| `maxResponseTokens` | `number` | `1000` | 回复最大 Token 数 |
| `milliseconds` | `number` | `60000` | 请求超时时间 (毫秒) |

### 请求参数 (sendMessage 第二个参数)

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `parentMessageId` | `string` | 上一条消息的 ID，用于关联上下文 |
| `onProgress` | `function` | 流式响应回调函数 |
| `systemMessage` | `string` | 覆盖当前对话的系统提示词 |
| `requestParams` | `object` | 覆盖初始化的请求参数 (如临时切换模型) |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

MIT
