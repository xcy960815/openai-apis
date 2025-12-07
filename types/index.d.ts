import Gpt3Tokenizer from 'gpt3-tokenizer';

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
    tools?: Array<Tool>;
    tool_choice?: string | {
        type: 'function';
        function: {
            name: string;
        };
    };
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

export declare type BuildConversationReturns<R extends Role | "gpt-assistant"> = R extends 'user' ? Conversation : R extends 'gpt-assistant' ? AssistantConversation : R extends 'tool' ? Conversation : R extends 'function' ? Conversation : undefined;

export declare class ChatClient extends ClientBase {
    /**
     * @desc 请求参数
     */
    private requestParams;
    constructor(options: ChatClientOptions);
    /**
     * @desc completions请求地址
     * @returns {string}
     */
    protected get completionsUrl(): string;
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
    sendMessage(question: string, options: ChatSendMessageOptions): Promise<AssistantConversation>;
    /**
     * @desc 获取会话消息历史
     * @param {string} text
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
    export type AssistantConversation = AssistantConversation;
    export type SendMessageOptions = ChatSendMessageOptions;
    export type ChatClientOptions = ChatClientOptions;
}

export declare interface ChatClientOptions extends ClientBaseOptions {
    requestParams?: Partial<Omit<ChatRequestParams, 'messages' | 'n' | 'stream'>>;
}

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
    delta: ChatResponseDelta;
}

export declare interface ChatResponseDelta extends ChatResponseMessage {
    tool_calls?: Array<ToolCall>;
}

export declare interface ChatResponseMessage {
    role: Role;
    content: string | null;
    tool_calls?: Array<ToolCall>;
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
 * @description 基础类 有一些公共方法
 *
 */
export declare class ClientBase {
    /** gpt 对话key */
    protected apiKey: string;
    /** gpt 请求域名 */
    protected apiBaseUrl: string;
    /** gpt 组织 */
    protected organization?: string;
    /** 是否开启debug */
    protected debug: boolean;
    /** 是否携带上下文 */
    protected withContent: boolean;
    /** 消息仓库 */
    protected messageStore: Map<string, Conversation>;
    /** 最大请求token */
    protected maxModelTokens: number;
    /** 最多返回token */
    protected maxResponseTokens: number;
    /** 系统角色 */
    protected systemMessage: string;
    /** 取消fetch请求控制器 */
    protected abortController: AbortController;
    /** 用于计算token */
    protected gpt3Tokenizer: Gpt3Tokenizer;
    /** 超时时间 */
    protected milliseconds: number;
    /** 是否将markdown语法转换成html */
    protected markdown2Html: boolean;
    constructor(options: ClientBaseOptions);
    /**
     * @desc 解析markdown
     * @param {string} text
     * @returns {string}
     */
    protected parseMarkdown(text: string): string;
    /**
     * @desc models 请求地址
     * @returns {string}
     */
    protected get modelUrl(): string;
    /**
     * @desc 生成随机id
     * @returns {string}
     */
    protected get uuid(): string;
    /**
     * @desc 请求头
     * @returns {HeadersInit}
     */
    protected get headers(): HeadersInit;
    /**
     * @desc 获取token数量
     * @param {string} text
     * @returns {Promise<number>}
     */
    protected getTokenCount(_text: string): Promise<number>;
    /**
     * @description 构建会话消息
     * @param {"user" | "gpt-assistant"} role
     * @param {string} content
     * @param {BaseSendMessageOptions} option
     * @returns {Conversation}
     */
    protected buildConversation<R extends Role | "gpt-assistant">(role: R, content: string, option: BaseSendMessageOptions): BuildConversationReturns<R>;
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
     * 这个方法的作用是将一个 ReadableStream 对象转换成一个异步迭代器 AsyncIterable，
     * 该迭代器会在每次迭代中返回一个 Uint8Array 类型的数据块。具体来说，该方法会获取一个 ReadableStream 对象的读取器（reader），
     * 然后在一个无限循环中等待读取器返回数据。每次读取器返回数据时，该方法都会返回一个包含数据的 Uint8Array 对象。
     * 当读取器返回一个 done 属性为 true 的对象时，该方法就会结束迭代。最后，该方法会释放读取器的锁。
     * @param {ReadableStream<Uint8Array>} stream
     * @returns {AsyncIterable<Uint8Array>}
     */
    private streamAsyncIterable;
    /**
     * @desc 向OpenAI发送请求
     * @param {string} url
     * @param {FetchSSEOptions} options
     * @returns {Promise<GptResponse<R> | void>}
     */
    protected fetchSSE<R extends Object>(url: string, requestInit: FetchRequestInit): Promise<AnswerResponse<R> | void>;
    /**
     * @description 创建parser
     * @param {(p:string)=>void} onMessage
     * @returns {EventSourceParser}
     */
    private createParser;
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
    getModels(): Promise<void | AnswerResponse<Object>>;
}

/**
 * @desc 模型公共参数
 */
export declare interface ClientBaseOptions {
    apiKey: string;
    /** 请求连接 default https://api.OpenAI.com */
    apiBaseUrl?: string;
    /** 组织 */
    organization?: string;
    /** 是否开启debug模式 */
    debug?: boolean;
    /** @defaultValue 4096 **/
    maxModelTokens?: number;
    /** @defaultValue 1000 **/
    maxResponseTokens?: number;
    /** 是否携带上下文 */
    withContent?: boolean;
    /** 系统消息 */
    systemMessage?: string;
    /** 超时时间 */
    milliseconds?: number;
    /** 是否将markdown语法转换成html */
    markdown2Html?: boolean;
}

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
    parentMessageId: string;
    name?: string;
    tool_calls?: Array<ToolCall>;
    tool_call_id?: string;
    function_call?: FunctionCall;
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
