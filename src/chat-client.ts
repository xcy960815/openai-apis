
import { 
  ChatClientOptions, 
  ChatRequestParams, 
  ChatResponse, 
  ChatSendMessageOptions, 
  AssistantConversation, 
  FetchRequestInit, 
  ChatRequestMessage
} from "./types"
import { ClientBase } from "./client-base"
const MODEL = 'gpt-3.5-turbo';

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
      temperature: 0.8,
      top_p: 1,
      presence_penalty: 1,
      ...requestParams,
    };
  }

  /**
   * @desc completions请求地址
   * @returns {string}
   */
  protected get completionsUrl(): string {
    return `${this.apiBaseUrl}/v1/chat/completions`
  }

  /**
   * @description 构建fetch公共请求参数
   * @param {string} question 
   * @param {ChatSendMessageOptions} options 
   * @returns {Promise<FetchRequestInit>}
   */
  private async getFetchRequestInit(
    question: string,
    options: ChatSendMessageOptions,
  ): Promise<FetchRequestInit> {
    const { onProgress, stream = onProgress ? true : false, requestParams } = options
    // 获取用户和gpt历史对话记录
    const { messages, maxTokens } = await this.getConversationHistory(question, options);
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
  public async sendMessage(question: string, options: ChatSendMessageOptions): Promise<AssistantConversation> {
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
    // 包装成一个promise 发起请求
    const responseP = new Promise<AssistantConversation>(async (resolve, reject) => {
      try {
        const requestInit = await this.getFetchRequestInit(question, options)
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
              if (delta?.content) {
                rawContent += delta.content;
                assistantMessage.content = this.parseMarkdown(rawContent);
              }
              if (delta?.tool_calls) {
                  if (!assistantMessage.tool_calls) {
                      assistantMessage.tool_calls = [];
                  }
                  delta.tool_calls.forEach((toolCall, index) => {
                      if (!assistantMessage.tool_calls![index]) {
                          assistantMessage.tool_calls![index] = toolCall;
                      } else {
                          assistantMessage.tool_calls![index].function.arguments += toolCall.function.arguments;
                      }
                  });
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
            const content = message?.content || '';
            assistantMessage.content = this.parseMarkdown(content);
            assistantMessage.role = message?.role || 'assistant';
            if (message?.tool_calls) {
                assistantMessage.tool_calls = message.tool_calls;
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
        return this.upsertConversation(Conversation).then(() => {
          Conversation.parentMessageId = Conversation.messageId;
          return Conversation
        })
      });
    return this.clearablePromise(responseP, {
      milliseconds: this.milliseconds,
      message: ``
    })
  }


  /**
   * @desc 获取会话消息历史
   * @param {string} text
   * @param {Required<ChatSendMessageOptions>} options
   * @returns {Promise<{ messages: ChatRequestMessage[]; }>}
   */
  private async getConversationHistory(text: string, options: ChatSendMessageOptions): Promise<{ messages: Array<ChatRequestMessage>, maxTokens: number }> {

    const { systemMessage } = options;
    const maxTokenCount = this.maxModelTokens - this.maxResponseTokens;
    // 上次的会话id
    let parentMessageId = options.parentMessageId;

    // 当前系统和用户消息
    const messages: Array<ChatRequestMessage> = [
      {
        role: 'system',
        content: systemMessage || this.systemMessage,
      },
      // 用户当前的问题
      {
        role: 'user',
        content: text,
      },
    ];

    // 预先计算必须包含的消息（System + User）的 Token
    let tokenCount = 0;
    const systemMessageStr = messages[0].role + messages[0].content;
    const userMessageStr = messages[1].role + messages[1].content;
    
    // 基础 Token 数（包含 System 和 User）
    tokenCount = await this.getTokenCount(systemMessageStr) + await this.getTokenCount(userMessageStr);

    while (true && this.withContent) {
      // 如果基础 Token 已经超过限制，直接跳出（虽然理论上不应该发生，除非 system/user 极其长）
      if (tokenCount > maxTokenCount) {
        break;
      }

      if (!parentMessageId) { break; }

      const parentMessage = await this.getConversation(parentMessageId);

      if (!parentMessage) { break; }

      const historyConversation = {
        role: parentMessage.role,
        content: parentMessage.content,
      }
      
      // 计算当前历史消息的 Token
      const historyMessageStr = historyConversation.role + historyConversation.content;
      const historyTokenCount = await this.getTokenCount(historyMessageStr);

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
