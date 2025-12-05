import { OpenAI } from "./index";
import Gpt3Tokenizer from 'gpt3-tokenizer';
/**
 * @description 基础类 有一些公共方法

 */
export declare class Core {
    /** 用于区分是哪个模型的继承 返回不同请求地址 */
    private _who;
    /** gpt 对话key */
    protected _apiKey: string;
    /** gpt 请求域名 */
    protected _apiBaseUrl: string;
    /** gpt 组织 */
    protected _organization?: string;
    /** 是否开启debug */
    protected _debug: boolean;
    /** 是否携带上下文 */
    protected _withContent: boolean;
    /** 消息仓库 */
    protected _messageStore: Map<string, OpenAI.Conversation>;
    /** 最大请求token */
    protected _maxModelTokens: number;
    /** 最多返回token */
    protected _maxResponseTokens: number;
    /** 系统角色 */
    protected _systemMessage: string;
    /** 取消fetch请求控制器 */
    protected _abortController: AbortController;
    /** 用于计算token */
    protected _gpt3Tokenizer: Gpt3Tokenizer;
    /** 超时时间 */
    protected _milliseconds: number;
    constructor(options: OpenAI.CoreOptions, who: string);
    /**
     * @desc completions请求地址
     * @returns {string}
     */
    protected get completionsUrl(): string;
    /**
     * @desc models 请求地址
     * @returns {string}
     */
    private get modelUrl();
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
     * @param {"user" | "gpt-assistant" | "text-assistant"} role
     * @param {string} content
     * @param {OpenAI.SendMessageOptions} option
     * @returns {OpenAI.Conversation}
     */
    protected buildConversation<R extends "user" | "gpt-assistant" | "text-assistant">(role: R, content: string, option: OpenAI.GetAnswerOptions): OpenAI.BuildConversationReturns<R>;
    /**
     * @desc 获取对话
     * @param {string} id
     * @returns {Promise<OpenAI.Conversation | undefined>}
     */
    protected getConversation(id: string): Promise<OpenAI.Conversation | undefined>;
    /**
     * @desc 更新对话
     * @param {OpenAI.Conversation} message
     * @returns {Promise<void>}
     */
    protected upsertConversation(message: OpenAI.Conversation): Promise<void>;
    /**
     * @desc 清空消息
     * @returns {Promise<void>}
     */
    protected _clearMessage(): Promise<void>;
    /**
     * @desc 输出debug参数
     * @param {string} action
     * @param {any[]} args
     * @returns {void}
     */
    protected _debugLog(action: string, ...args: any[]): void;
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
     * @param {OpenAI.FetchSSEOptions} options
     * @returns {Promise<OpenAI.GptResponse<R> | void>}
     */
    protected _fetchSSE<R extends Object>(url: string, requestInit: OpenAI.FetchRequestInit): Promise<OpenAI.AnswerResponse<R> | void>;
    /**
     * @description 创建parser
     * @param {(p:string)=>void} onMessage
     * @returns {EventSourceParser}
     */
    private _createParser;
    /**
     * @description 清空promise
     */
    protected clearablePromise<V = any>(inputPromise: PromiseLike<V>, options: OpenAI.ClearablePromiseOptions): Promise<V>;
    /**
     * @desc 取消对话
     * @param {string}reson
     * @returns {void}
     */
    cancelConversation(reson?: string): void;
    getModels(): Promise<void | OpenAI.AnswerResponse<Object>>;
}
/**
 * @desc ChatGPT 错误类
 */
export declare class ChatgptError extends Error {
    status?: number;
    statusText?: string;
    url?: string;
    constructor(message: string, option?: OpenAI.ChatgptErrorOption);
}
