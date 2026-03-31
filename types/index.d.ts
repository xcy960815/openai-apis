export declare interface AnswerResponse<T = any> extends globalThis.Response {
    json(): Promise<T>;
}

export declare interface AssistantConversation extends Conversation {
    detail?: ChatResponse | null;
}

/**
 * @desc 公共请求参数
 */
export declare interface BaseRequestParams {
    /** 模型 */
    model: string;
    max_tokens?: number;
    temperature?: number | null;
    top_p?: number | null;
    n?: number | null;
    stream?: boolean | null;
    stop?: Array<string> | string;
    logit_bias?: Record<string, number>;
    presence_penalty?: number | null;
    frequency_penalty?: number | null;
    user?: string;
    prompt_cache_key?: string;
    prompt_cache_retention?: string;
    reasoning_effort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
    verbosity?: 'low' | 'medium' | 'high';
    tools?: Array<Tool>;
    tool_choice?: string | {
        type: 'function';
        function: {
            name: string;
        };
    };
    parallel_tool_calls?: boolean;
    store?: boolean | null;
    metadata?: Record<string, string>;
    response_format?: {
        type: 'text';
    } | {
        type: 'json_object';
    } | {
        type: 'json_schema';
        json_schema: {
            name: string;
            description?: string;
            schema?: Record<string, any>;
            strict?: boolean;
        };
    };
    stream_options?: {
        include_usage?: boolean;
    };
    modalities?: Array<'text' | 'audio'> | string[];
    audio?: {
        format: 'wav' | 'mp3' | 'flac' | 'opus' | 'pcm16';
        voice: string | {
            id: string;
        };
    } | null;
    prediction?: Record<string, any>;
    service_tier?: 'auto' | 'default' | 'flex' | 'priority' | string;
    safety_identifier?: string;
    web_search_options?: Record<string, any>;
}

export declare interface BaseResponse {
    /** id */
    id: string;
    /** example "chat.completion" */
    object: string;
    /** 创建时间（时间戳） */
    created: number;
    /** 本次回答所用到的模型 */
    model: string;
    /** 当用户设置stream:true时，不会返回 usage 字段 */
    usage?: ResponseUsage;
}

/**
 * @desc 公共返回的Choice参数
 */
export declare interface BaseResponseChoice {
    /** 下标 */
    index?: number;
    /** 结束原因 */
    finish_reason?: string | null;
    /** 参数未知 作用未知 */
    content_filter_results?: {
        hate: {
            filtered: boolean;
            severity: string;
        };
        self_harm: {
            filtered: boolean;
            severity: string;
        };
        sexual: {
            filtered: boolean;
            severity: string;
        };
        violence: {
            filtered: boolean;
            severity: string;
        };
    };
}

/**
 * @desc 公共发送消息选项
 */
export declare interface BaseSendMessageOptions {
    parentMessageId?: string;
    messageId?: string;
    stream?: boolean;
    systemMessage?: string;
    role?: Role;
    tool_call_id?: string;
    name?: string;
}

export declare type BuildConversationReturns<R extends Role | 'gpt-assistant'> = R extends 'user' ? Conversation : R extends 'assistant' ? Conversation : R extends 'gpt-assistant' ? AssistantConversation : R extends 'system' ? Conversation : R extends 'tool' ? Conversation : R extends 'function' ? Conversation : undefined;

export declare class ChatClient extends ClientCore {
    /**
     * @desc 请求参数
     */
    private requestParams;
    constructor(options: ChatClientOptions);
    /**
     * @desc completions 请求路径
     */
    protected get completionsPath(): string;
    /**
     * @description 构建fetch公共请求参数
     * @param {string} question
     * @param {ChatSendMessageOptions} options
     * @returns {Promise<FetchRequestInit>}
     */
    private getFetchRequestInit;
    /**
     * @desc 获取答案
     * @param {string} question
     * @param {ChatSendMessageOptions} options
     * @returns {Promise<AssistantConversation>}
     */
    sendMessage(question: string, options?: ChatSendMessageOptions): Promise<AssistantConversation>;
    private toChatRequestMessage;
    private mergeToolCalls;
    /**
     * @desc 获取会话消息历史
     * @param {Conversation} currentMessage
     * @param {Required<ChatSendMessageOptions>} options
     * @returns {Promise<{ messages: ChatRequestMessage[]; }>}
     */
    private getConversationHistory;
}

/**
 * @desc gpt 模型模块
 */
export declare namespace ChatClient {
    export type RequestMessage = ChatRequestMessage;
    export type RequestParams = ChatRequestParams;
    export type ResponseMessage = ChatResponseMessage;
    export type ResponseDelta = ChatResponseDelta;
    export type ResponseChoice = ChatResponseChoice;
    export type Response = ChatResponse;
    export type AssistantConversation = ChatClientAssistantConversationAlias;
    export type SendMessageOptions = ChatSendMessageOptions;
    export type ChatClientOptions = ChatClientOptionsAlias;
}

declare type ChatClientAssistantConversationAlias = AssistantConversation;

export declare interface ChatClientOptions extends ClientBaseOptions {
    requestParams?: Partial<Omit<ChatRequestParams, 'messages' | 'n' | 'stream'>>;
}

declare type ChatClientOptionsAlias = ChatClientOptions;

/**
 * @desc ChatGPT 错误类
 */
export declare class ChatgptError extends Error {
    status?: number;
    statusText?: string;
    url?: string;
    constructor(message: string, option?: ChatgptErrorOption);
}

export declare interface ChatgptErrorOption {
    status?: number;
    statusText?: string;
    url?: string;
}

export declare interface ChatRequestMessage extends Omit<Conversation, 'messageId' | 'parentMessageId'> {
}

/**
 * @desc 请求参数
 */
export declare interface ChatRequestParams extends BaseRequestParams {
    messages: Array<ChatRequestMessage>;
}

/**
 * @desc 不走steam流接口的输出结果
 */
export declare interface ChatResponse extends BaseResponse {
    choices: Array<ChatResponseChoice>;
}

export declare interface ChatResponseChoice extends BaseResponseChoice {
    message?: ChatResponseMessage;
    delta?: ChatResponseDelta;
}

export declare interface ChatResponseDelta extends ChatResponseMessage {
    tool_calls?: Array<ToolCall>;
}

export declare interface ChatResponseMessage {
    role: Role;
    content: string | null;
    tool_calls?: Array<ToolCall>;
    function_call?: FunctionCall;
}

export declare interface ChatSendMessageOptions extends BaseSendMessageOptions {
    onProgress?: (partialResponse: AssistantConversation) => void;
    requestParams?: Partial<Omit<ChatRequestParams, 'messages' | 'n' | 'stream'>>;
}

export declare type ClearablePromiseOptions = {
    milliseconds: number;
    message?: string;
};

/**
 * @desc 模型公共参数
 */
export declare interface ClientBaseOptions {
    apiKey: string;
    /** 请求连接，支持 `https://api.openai.com` 和 `https://api.openai.com/v1` */
    apiBaseUrl?: string;
    /** `apiBaseUrl` 的别名，便于与官方 SDK 配置风格保持一致 */
    baseURL?: string;
    /** 组织 */
    organization?: string;
    /** 是否开启debug模式 */
    debug?: boolean;
    /** @defaultValue 4096 **/
    maxModelTokens?: number;
    /** @defaultValue 1000 **/
    maxResponseTokens?: number;
    /** 是否启用默认的内存会话存储；推荐直接传 `conversationStore` */
    withContent?: boolean;
    /** 显式提供会话存储，默认不保存历史 */
    conversationStore?: ConversationStore | false;
    /** 自定义 Token 计数器 */
    tokenCounter?: TokenCounter;
    /** 自定义 OpenAI-compatible 传输实现 */
    transport?: OpenAITransport;
    /** 系统消息 */
    systemMessage?: string;
    /** 超时时间 */
    milliseconds?: number;
    /** 是否将 markdown 转换为 HTML，兼容旧用法 */
    markdown2Html?: boolean;
    /** 自定义响应内容转换器 */
    transformResponseContent?: ContentTransformer;
}

/**
 * @description 客户端核心运行时，负责组合 transport、store、token counter 等公共能力
 *
 */
declare class ClientCore {
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
    private readonly contentTransformer;
    /** Token 计数器 */
    private readonly tokenCounter;
    constructor(options: ClientCoreOptions);
    /**
     * @desc 转换响应内容
     * @param {string} text
     * @returns {string}
     */
    protected transformContent(text: string): string;
    /**
     * @desc 生成随机id
     * @returns {string}
     */
    protected get uuid(): string;
    /**
     * @desc 发起 OpenAI-compatible 请求
     */
    protected request<R extends object>(path: string, requestInit: FetchRequestInit): Promise<AnswerResponse<R> | void>;
    /**
     * @desc 获取token数量
     * @param {string} text
     * @returns {Promise<number>}
     */
    protected getTokenCount(_text: string, options?: TokenCountOptions): Promise<number>;
    /**
     * @desc 是否启用了会话存储
     */
    protected hasConversationStore(): boolean;
    /**
     * @desc 获取会话存储
     */
    protected requireConversationStore(): ConversationStore;
    /**
     * @description 构建会话消息
     * @param {"user" | "gpt-assistant"} role
     * @param {string} content
     * @param {BaseSendMessageOptions} option
     * @returns {Conversation}
     */
    protected buildConversation<R extends Role | 'gpt-assistant'>(role: R, content: string, option: BaseSendMessageOptions): BuildConversationReturns<R>;
    /**
     * @desc 获取对话
     * @param {string} id
     * @returns {Promise<Conversation | undefined>}
     */
    protected getConversation(id: string): Promise<Conversation | undefined>;
    /**
     * @desc 更新对话
     * @param {Conversation} message
     * @returns {Promise<void>}
     */
    protected upsertConversation(message: Conversation): Promise<void>;
    /**
     * @desc 清空消息
     * @returns {Promise<void>}
     */
    protected clearMessage(): Promise<void>;
    /**
     * @desc 输出debug参数
     * @param {string} action
     * @param {any[]} args
     * @returns {void}
     */
    protected debugLog(action: string, ...args: any[]): void;
    /**
     * @desc 将消息序列化用于 Token 估算，尽量覆盖 tool/function call 元数据
     */
    protected serializeConversationForTokenCount(message: Partial<Conversation>): string;
    /**
     * @description 清空promise
     */
    protected clearablePromise<V = any>(inputPromise: PromiseLike<V>, options: ClearablePromiseOptions): Promise<V>;
    /**
     * @desc 取消对话
     * @param {string}reson
     * @returns {void}
     */
    cancelConversation(reson?: string): void;
    getModels(): Promise<void | AnswerResponse<ListModelsResponse>>;
}
export { ClientCore as ClientBase }
export { ClientCore }

export declare type ClientCoreOptions = ClientBaseOptions;

export declare type ContentTransformer = (text: string) => string;

/**
 * @description 系统、用户、助手（gpt）会话消息
 * @param role 角色 system 给系统设置的人设 user用户 assistant 助手 gpt
 * @param content 对话内容
 * @param messageId 当前对话产生的id
 * @param parentMessageId 上次对话消息id
 */
export declare interface Conversation {
    role: Role;
    content: string | null;
    messageId: string;
    parentMessageId?: string;
    name?: string;
    tool_calls?: Array<ToolCall>;
    tool_call_id?: string;
    function_call?: FunctionCall;
}

export declare interface ConversationStore {
    get(messageId: string): Promise<Conversation | undefined>;
    set(message: Conversation): Promise<void>;
    clear(): Promise<void>;
}

export declare class FetchOpenAITransport implements OpenAITransport {
    private readonly apiKey;
    private readonly apiBaseUrl;
    private readonly organization?;
    constructor(options: OpenAITransportOptions);
    request<R extends object>(path: string, requestInit: FetchRequestInit, abortSignal: AbortSignal): Promise<AnswerResponse<R> | void>;
    private buildApiUrl;
    private buildHeaders;
    private createParser;
    private streamAsyncIterable;
}

/**
 * @desc fetch 请求配置
 */
export declare interface FetchRequestInit extends RequestInit {
    onMessage?: (message: string) => void;
}

export declare interface FunctionCall {
    name: string;
    arguments: string;
}

/**
 * @desc Function definition
 */
export declare interface FunctionDef {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
}

/**
 * @deprecated Use `JsTiktokenTokenCounter` instead.
 */
export declare class Gpt3TokenizerTokenCounter extends JsTiktokenTokenCounter {
}

export declare class InMemoryConversationStore implements ConversationStore {
    private readonly messageStore;
    get(messageId: string): Promise<Conversation | undefined>;
    set(message: Conversation): Promise<void>;
    clear(): Promise<void>;
}

export declare class JsTiktokenTokenCounter implements TokenCounter {
    private readonly cl100kTokenizer;
    private readonly o200kTokenizer;
    count(text: string, options?: TokenCountOptions): Promise<number>;
    private getTokenizer;
}

export declare interface ListModelsResponse {
    object: string;
    data: Array<Model>;
}

export declare interface Model {
    id: string;
    object: string;
    owned_by: string;
}

export declare interface OpenAITransport {
    request<R extends object>(path: string, requestInit: FetchRequestInit, abortSignal: AbortSignal): Promise<AnswerResponse<R> | void>;
}

export declare interface OpenAITransportOptions {
    apiKey: string;
    /** 请求连接，支持 `https://api.openai.com` 和 `https://api.openai.com/v1` */
    apiBaseUrl?: string;
    /** `apiBaseUrl` 的别名，便于与官方 SDK 配置风格保持一致 */
    baseURL?: string;
    /** 组织 */
    organization?: string;
}

/**
 * @desc 公共返回usage
 */
export declare interface ResponseUsage {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
}

export declare type Role = 'system' | 'user' | 'assistant' | 'tool' | 'function';

/**
 * @desc 公共角色枚举
 */
export declare enum RoleEnum {
    System = "system",
    User = "user",
    Assistant = "assistant"
}

export declare interface TokenCounter {
    count(text: string, options?: TokenCountOptions): Promise<number>;
}

export declare interface TokenCountOptions {
    model?: string;
}

/**
 * @desc Tool definition
 */
export declare interface Tool {
    type: 'function';
    function: FunctionDef;
}

/**
 * @desc Tool call in response
 */
export declare interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export { }
