import {
  ClientCoreOptions,
  Conversation,
  Role,
  BaseSendMessageOptions,
  BuildConversationReturns,
  FetchRequestInit,
  AnswerResponse,
  ClearablePromiseOptions,
  ListModelsResponse,
  ConversationStore,
  OpenAITransport,
  TokenCountOptions,
  TokenCounter,
} from './sdk-types';
import { v4 as uuidv4 } from 'uuid';
import { InMemoryConversationStore } from './in-memory-conversation-store';
import { createContentTransformer } from './content-transformer';
import { ChatgptError } from './chatgpt-error';
import { Gpt3TokenizerTokenCounter } from './js-tiktoken-token-counter';
import { FetchOpenAITransport } from './fetch-openai-transport';

/**
 * @description 客户端核心运行时，负责组合 transport、store、token counter 等公共能力
 *
 */
export class ClientCore {
  /** 是否开启debug */
  protected debug: boolean;
  /** 会话存储 */
  protected conversationStore?: ConversationStore;
  /** 最大请求token */
  protected maxModelTokens: number;
  /** 最多返回token */
  protected maxResponseTokens: number;
  /** 系统角色 */
  protected systemMessage?: string;
  /** 取消fetch请求控制器 */
  protected abortController: AbortController;
  /** 超时时间 */
  protected milliseconds: number;
  /** OpenAI-compatible 传输实现 */
  protected transport: OpenAITransport;
  /** 内容转换器 */
  private readonly contentTransformer: (text: string) => string;
  /** Token 计数器 */
  private readonly tokenCounter: TokenCounter;

  constructor(options: ClientCoreOptions) {
    const {
      apiKey,
      apiBaseUrl,
      baseURL,
      organization,
      debug,
      withContent,
      conversationStore,
      tokenCounter,
      transport,
      maxModelTokens,
      maxResponseTokens,
      systemMessage,
      milliseconds,
      markdown2Html,
      transformResponseContent,
    } = options;

    this.debug = !!debug;

    this.conversationStore =
      conversationStore === false
        ? undefined
        : (conversationStore ?? (withContent ? new InMemoryConversationStore() : undefined));

    this.maxModelTokens = maxModelTokens ?? 4096;

    this.maxResponseTokens = maxResponseTokens ?? 1000;

    this.tokenCounter = tokenCounter ?? new Gpt3TokenizerTokenCounter();

    this.systemMessage = systemMessage?.trim() ? systemMessage : undefined;

    this.abortController = new AbortController();

    this.milliseconds = milliseconds ?? 1000 * 60;

    this.transport =
      transport ??
      new FetchOpenAITransport({
        apiKey,
        apiBaseUrl,
        baseURL,
        organization,
      });

    this.contentTransformer = createContentTransformer({
      markdown2Html,
      transformResponseContent,
    });
  }

  /**
   * @desc 转换响应内容
   * @param {string} text
   * @returns {string}
   */
  protected transformContent(text: string): string {
    return this.contentTransformer(text);
  }

  /**
   * @desc 生成随机id
   * @returns {string}
   */
  protected get uuid(): string {
    return uuidv4();
  }

  /**
   * @desc 发起 OpenAI-compatible 请求
   */
  protected async request<R extends object>(
    path: string,
    requestInit: FetchRequestInit,
  ): Promise<AnswerResponse<R> | void> {
    return this.transport.request<R>(path, requestInit, this.abortController.signal);
  }

  /**
   * @desc 获取token数量
   * @param {string} text
   * @returns {Promise<number>}
   */
  protected async getTokenCount(_text: string, options?: TokenCountOptions): Promise<number> {
    return this.tokenCounter.count(_text, options);
  }

  /**
   * @desc 是否启用了会话存储
   */
  protected hasConversationStore(): boolean {
    return !!this.conversationStore;
  }

  /**
   * @desc 获取会话存储
   */
  protected requireConversationStore(): ConversationStore {
    if (!this.conversationStore) {
      throw new ChatgptError(
        'parentMessageId requires a conversationStore. Pass conversationStore or withContent: true to enable history.',
      );
    }

    return this.conversationStore;
  }

  /**
   * @description 构建会话消息
   * @param {"user" | "gpt-assistant"} role
   * @param {string} content
   * @param {BaseSendMessageOptions} option
   * @returns {Conversation}
   */
  protected buildConversation<R extends Role | 'gpt-assistant'>(
    role: R,
    content: string,
    option: BaseSendMessageOptions,
  ): BuildConversationReturns<R> {
    if (
      role === 'user' ||
      role === 'assistant' ||
      role === 'tool' ||
      role === 'function' ||
      role === 'system'
    ) {
      return {
        role: role as Role,
        messageId: option.messageId || this.uuid,
        parentMessageId: option.parentMessageId,
        content,
        tool_call_id: option.tool_call_id,
        name: option.name,
      } as BuildConversationReturns<R>;
    } else if (role === 'gpt-assistant') {
      return {
        role: 'assistant',
        messageId: '',
        parentMessageId: option.messageId || this.uuid,
        content,
        detail: null,
      } as BuildConversationReturns<R>;
    } else {
      return undefined as unknown as BuildConversationReturns<R>;
    }
  }

  /**
   * @desc 获取对话
   * @param {string} id
   * @returns {Promise<Conversation | undefined>}
   */
  protected getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversationStore?.get(id) ?? Promise.resolve(undefined);
  }
  /**
   * @desc 更新对话
   * @param {Conversation} message
   * @returns {Promise<void>}
   */
  protected upsertConversation(message: Conversation): Promise<void> {
    return this.conversationStore?.set(message) ?? Promise.resolve();
  }
  /**
   * @desc 清空消息
   * @returns {Promise<void>}
   */
  protected clearMessage(): Promise<void> {
    return this.conversationStore?.clear() ?? Promise.resolve();
  }
  /**
   * @desc 输出debug参数
   * @param {string} action
   * @param {any[]} args
   * @returns {void}
   */
  protected debugLog(action: string, ...args: any[]) {
    if (this.debug) {
      console.log(`OpenAI-apis:DEBUG:${action}`, ...args);
    }
  }

  /**
   * @desc 将消息序列化用于 Token 估算，尽量覆盖 tool/function call 元数据
   */
  protected serializeConversationForTokenCount(message: Partial<Conversation>): string {
    return JSON.stringify({
      role: message.role,
      content: message.content ?? '',
      name: message.name,
      tool_call_id: message.tool_call_id,
      tool_calls: message.tool_calls,
      function_call: message.function_call,
    });
  }

  /**
   * @description 清空promise
   */
  protected clearablePromise<V = any>(
    inputPromise: PromiseLike<V>,
    options: ClearablePromiseOptions,
  ) {
    const { milliseconds, message } = options;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wrappedPromise = new Promise<V>((resolve, reject) => {
      if (milliseconds === Number.POSITIVE_INFINITY) {
        inputPromise.then(resolve, reject);
        return;
      }
      try {
        timer = setTimeout.call(
          undefined,
          () => {
            // 终止请求
            this.abortController.abort();
            this.abortController = new AbortController();
            const errorMessage =
              message && message.trim()
                ? message
                : `Promise timed out after ${milliseconds} milliseconds`;
            const timeoutError = new ChatgptError(errorMessage);
            reject(timeoutError);
          },
          milliseconds,
        );
      } catch (error) {
        reject(error);
      } finally {
        inputPromise.then(
          (inputPromiseResult) => {
            resolve(inputPromiseResult);
          },
          (error) => {
            reject(error);
          },
        );
      }
    });

    /**
     * @desc 默认清除定时器
     */
    const cancelablePromise = wrappedPromise.then(
      (value) => {
        clearTimeout.call(undefined, timer);
        timer = undefined;
        return value;
      },
      (error) => {
        clearTimeout.call(undefined, timer);
        timer = undefined;
        throw error;
      },
    );

    return cancelablePromise;
  }
  /**
   * @desc 取消对话
   * @param {string}reson
   * @returns {void}
   */
  public cancelConversation(reson?: string) {
    this.abortController.abort(reson);
    this.abortController = new AbortController();
  }

  public getModels() {
    return this.request<ListModelsResponse>('/models', { method: 'GET' });
  }
}

export { ClientCore as ClientBase };
export { ChatgptError } from './chatgpt-error';
