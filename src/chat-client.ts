
import { 
  ChatClientOptions, 
  ChatRequestParams, 
  ChatResponse, 
  ChatSendMessageOptions, 
  AssistantConversation, 
  FetchRequestInit, 
  ChatRequestMessage,
  Conversation,
  ToolCall
} from "./types"
import { ClientBase } from "./client-base"
const MODEL = 'gpt-5-mini';

export class ChatClient extends ClientBase {
  /**
   * @desc 请求参数
   */
  private requestParams: Partial<Omit<ChatRequestParams, 'messages' | 'n' | 'stream'>>;

  constructor(options: ChatClientOptions) {
    const { requestParams, ...coreOptions } = options;
    super(coreOptions)
    this.requestParams = {
      model: MODEL,
      ...requestParams,
    };
  }

  /**
   * @desc completions请求地址
   * @returns {string}
   */
  protected get completionsUrl(): string {
    return this.buildApiUrl('/chat/completions')
  }

  /**
   * @description 构建fetch公共请求参数
   * @param {string} question 
   * @param {ChatSendMessageOptions} options 
   * @returns {Promise<FetchRequestInit>}
   */
  private async getFetchRequestInit(
    currentMessage: Conversation,
    options: ChatSendMessageOptions = {},
  ): Promise<FetchRequestInit> {
    const { onProgress, stream = onProgress ? true : false, requestParams } = options
    // 获取用户和gpt历史对话记录
    const { messages, maxTokens } = await this.getConversationHistory(currentMessage, options);
    const body = { ...this.requestParams, ...requestParams, messages, stream, max_tokens: maxTokens };
    const requestInit: FetchRequestInit = { method: 'POST', headers: this.headers, body: JSON.stringify(body), signal: this.abortController.signal };
    return requestInit
  }

  /**
   * @desc 获取答案
   * @param {string} question
   * @param {ChatSendMessageOptions} options
   * @returns {Promise<AssistantConversation>}
   */
  public async sendMessage(question: string, options: ChatSendMessageOptions = {}): Promise<AssistantConversation> {
    const { onProgress, stream = onProgress ? true : false } = options
    // 构建用户消息
    const role = options.role || 'user';
    const userMessage = this.buildConversation(role, question, options);
    if (!userMessage) {
        throw new Error('Failed to build conversation message');
    }
    // 保存用户对话
    await this.upsertConversation(userMessage);
    // 构建助手消息
    const assistantMessage = this.buildConversation('gpt-assistant', "", { ...options, messageId: userMessage.messageId })
    let rawContent = "";
    let rawAssistantContent: string | null = '';
    // 包装成一个promise 发起请求
    const responseP = new Promise<AssistantConversation>(async (resolve, reject) => {
      try {
        const requestInit = await this.getFetchRequestInit(userMessage, options)
        if (stream) {
          requestInit.onMessage = (data: string) => {
            if (data === '[DONE]') {
              assistantMessage.content = (assistantMessage.content || '').trim();
              return resolve(assistantMessage)
            }
            const response: ChatResponse = JSON.parse(data);
            assistantMessage.messageId = response.id
            if (response?.choices?.length) {
              const delta = response.choices[0].delta;
              if (!delta) {
                return;
              }
              if (delta?.content) {
                rawContent += delta.content;
                rawAssistantContent = rawContent;
                assistantMessage.content = this.parseMarkdown(rawContent);
              }
              if (delta?.tool_calls) {
                  assistantMessage.tool_calls = this.mergeToolCalls(assistantMessage.tool_calls, delta.tool_calls);
              }
              assistantMessage.detail = response;
              if (delta?.role) {
                assistantMessage.role = delta.role;
              }
              onProgress?.(assistantMessage);
            }
          };
          await this.fetchSSE<ChatResponse>(this.completionsUrl, requestInit).catch(reject);;
        } else {
          // 发送数据请求
          const response = await this.fetchSSE<ChatResponse>(this.completionsUrl, requestInit);
          const data = await response?.json();
          if (data?.id) {
            assistantMessage.messageId = data.id;
          }
          if (data?.choices?.length) {
            const message = data.choices[0].message;
            const content = message?.content ?? '';
            rawAssistantContent = message?.content ?? null;
            assistantMessage.content = this.parseMarkdown(content);
            assistantMessage.role = message?.role || 'assistant';
            if (message?.tool_calls) {
                assistantMessage.tool_calls = message.tool_calls;
            }
            if (message?.function_call) {
                assistantMessage.function_call = message.function_call;
            }
          }
          assistantMessage.detail = data;
          resolve(assistantMessage);
        }
      } catch (error) {
        console.error('OpenAI EventStream error', error);
        return reject(error);
      }
    })
      .then(async (Conversation) => {
        const historyConversation = {
          ...Conversation,
          content: rawAssistantContent,
        };

        return this.upsertConversation(historyConversation).then(() => {
          Conversation.parentMessageId = Conversation.messageId;
          return Conversation
        })
      });
    return this.clearablePromise(responseP, {
      milliseconds: this.milliseconds,
      message: undefined
    })
  }

  private toChatRequestMessage(message: Conversation): ChatRequestMessage {
    const requestMessage: ChatRequestMessage = {
      role: message.role,
      content: message.content,
    };

    if (message.name) {
      requestMessage.name = message.name;
    }

    if (message.tool_call_id) {
      requestMessage.tool_call_id = message.tool_call_id;
    }

    if (message.tool_calls) {
      requestMessage.tool_calls = message.tool_calls;
    }

    if (message.function_call) {
      requestMessage.function_call = message.function_call;
    }

    return requestMessage;
  }

  private mergeToolCalls(
    currentToolCalls: Array<ToolCall> | undefined,
    deltaToolCalls: Array<ToolCall>,
  ): Array<ToolCall> {
    const nextToolCalls = currentToolCalls ? [...currentToolCalls] : [];

    deltaToolCalls.forEach((toolCall, index) => {
      const existingToolCall = nextToolCalls[index];

      if (!existingToolCall) {
        nextToolCalls[index] = {
          id: toolCall.id || '',
          type: toolCall.type || 'function',
          function: {
            name: toolCall.function?.name || '',
            arguments: toolCall.function?.arguments || '',
          },
        };
        return;
      }

      if (toolCall.id) {
        existingToolCall.id = toolCall.id;
      }

      if (toolCall.type) {
        existingToolCall.type = toolCall.type;
      }

      if (toolCall.function?.name) {
        existingToolCall.function.name = `${existingToolCall.function.name || ''}${toolCall.function.name}`;
      }

      if (toolCall.function?.arguments) {
        existingToolCall.function.arguments = `${existingToolCall.function.arguments || ''}${toolCall.function.arguments}`;
      }
    });

    return nextToolCalls;
  }

  /**
   * @desc 获取会话消息历史
   * @param {Conversation} currentMessage
   * @param {Required<ChatSendMessageOptions>} options
   * @returns {Promise<{ messages: ChatRequestMessage[]; }>}
   */
  private async getConversationHistory(currentMessage: Conversation, options: ChatSendMessageOptions = {}): Promise<{ messages: Array<ChatRequestMessage>, maxTokens: number }> {

    const { systemMessage } = options;
    const maxTokenCount = this.maxModelTokens - this.maxResponseTokens;
    // 上次的会话id
    let parentMessageId = options.parentMessageId;

    // 当前系统和用户消息
    const messages: Array<ChatRequestMessage> = [];
    if (currentMessage.role !== 'system') {
      messages.push({
        role: 'system',
        content: systemMessage || this.systemMessage,
      });
    }
    messages.push(this.toChatRequestMessage(currentMessage));

    let tokenCount = 0;
    for (const message of messages) {
      tokenCount += await this.getTokenCount(this.serializeConversationForTokenCount(message));
    }

    while (true && this.withContent) {
      // 如果基础 Token 已经超过限制，直接跳出（虽然理论上不应该发生，除非 system/user 极其长）
      if (tokenCount > maxTokenCount) {
        break;
      }

      if (!parentMessageId) { break; }

      const parentMessage = await this.getConversation(parentMessageId);

      if (!parentMessage) { break; }

      const historyConversation: ChatRequestMessage = {
        role: parentMessage.role,
        content: parentMessage.content,
      }

      if (parentMessage.name) {
        historyConversation.name = parentMessage.name;
      }

      if (parentMessage.tool_call_id) {
        historyConversation.tool_call_id = parentMessage.tool_call_id;
      }

      if (parentMessage.tool_calls) {
        historyConversation.tool_calls = parentMessage.tool_calls;
      }

      if (parentMessage.function_call) {
        historyConversation.function_call = parentMessage.function_call;
      }
      
      // 计算当前历史消息的 Token
      const historyTokenCount = await this.getTokenCount(this.serializeConversationForTokenCount(historyConversation));

      // 如果加上这条历史消息会超出限制，则停止添加
      if (tokenCount + historyTokenCount > maxTokenCount) {
        break;
      }

      // 累加 Token 并插入消息
      tokenCount += historyTokenCount;
      messages.splice(1, 0, historyConversation);

      // 上次对话id
      parentMessageId = parentMessage.parentMessageId;
    }

    const maxTokens = Math.max(1, Math.min(this.maxModelTokens - tokenCount, this.maxResponseTokens));

    return { messages, maxTokens };
  }

}

/**
 * @desc gpt 模型模块
 */
export namespace ChatClient {
    export type RequestMessage = import('./types').ChatRequestMessage;
    export type RequestParams = import('./types').ChatRequestParams;
    export type ResponseMessage = import('./types').ChatResponseMessage;
    export type ResponseDelta = import('./types').ChatResponseDelta;
    export type ResponseChoice = import('./types').ChatResponseChoice;
    export type Response = import('./types').ChatResponse;
    export type AssistantConversation = import('./types').AssistantConversation;
    export type SendMessageOptions = import('./types').ChatSendMessageOptions;
    export type ChatClientOptions = import('./types').ChatClientOptions;
}
