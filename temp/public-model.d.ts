import { openai } from "./index";
import Gpt3Tokenizer from 'gpt3-tokenizer';
/**
 * @description 基础类 有一些公共方法
 * @internal
 */
export declare class PublicModel {
    /** 用于区分是哪个模型的继承 返回不同请求地址 */
    private _who;
    /** gpt 对话key */
    protected _apiKey: string;
    /** gpt 请求域名 */
    protected _apiBaseUrl: string;
    protected _organization?: string;
    protected _debug: boolean;
    protected _fetch: openai.Fetch;
    protected _withContent: boolean;
    protected _messageStore: Map<string, openai.ConversationMessage>;
    protected _maxModelTokens: number;
    protected _maxResponseTokens: number;
    protected _systemMessage: string;
    protected _abortController: AbortController;
    protected _gpt3Tokenizer: Gpt3Tokenizer;
    protected inConversation: boolean;
    constructor(options: openai.ModelOptions, who: string);
    /**
     * @desc 请求地址
     * @returns {string}
     */
    protected get url(): string;
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
     * @param {"user" | "assistant"} role
     * @param {string} content
     * @param {openai.SendMessageOptions} option
     * @returns {openai.ConversationMessage}
     */
    protected buildConversationMessage<R extends "user" | "gpt-assistant" | "text-assistant">(role: R, content: string, option: openai.SendMessageOptions): openai.BuildConversationMessageReturns<R>;
    /**
     * @desc 获取对话
     * @param {string} id
     * @returns {Promise<openai.ConversationMessage | undefined>}
     */
    protected getConversationMessage(id: string): Promise<openai.ConversationMessage | undefined>;
    /**
     * @desc 更新对话
     * @param {openai.ConversationMessage} message
     * @returns {Promise<void>}
     */
    protected upsertConversationMessage(message: openai.ConversationMessage): Promise<void>;
    /**
     * @desc 清空消息
     * @returns {Promise<void>}
     */
    protected _clearMessage(): Promise<void>;
    /**
     * @desc 输出debug参数
     * @param {string} action
     * @param {any[]} args
     */
    protected debug(action: string, ...args: any[]): void;
    /**
     * 这个方法的作用是将一个 ReadableStream 对象转换成一个异步迭代器 AsyncIterable，
     * 该迭代器会在每次迭代中返回一个 Uint8Array 类型的数据块。具体来说，该方法会获取一个 ReadableStream 对象的读取器（reader），
     * 然后在一个无限循环中等待读取器返回数据。每次读取器返回数据时，该方法都会返回一个包含数据的 Uint8Array 对象。
     * 当读取器返回一个 done 属性为 true 的对象时，该方法就会结束迭代。最后，该方法会释放读取器的锁。
     * @param {ReadableStream<Uint8Array>} stream
     * @returns {AsyncIterable<Uint8Array>}
     */
    protected streamAsyncIterable(stream: ReadableStream<Uint8Array>): AsyncIterable<Uint8Array>;
    /**
     * @desc 向openai发送请求
     * @param {string} url
     * @param {openai.FetchSSEOptions} options
     * @param {Fetch} fetch
     * @returns {Promise<openai.GptResponse<R> | void>}
     */
    protected getAnswer<R extends Object>(url: string, requestInit: openai.FetchRequestInit, fetch: openai.Fetch): Promise<openai.AnswerResponse<R> | void>;
    /**
     * @desc 取消对话
     * @returns {void}
     */
    cancelConversation(): void;
}
/**
 * @desc ChatGPT 错误类
 */
export declare class ChatgptError extends Error {
    status?: number;
    statusText?: string;
    url?: string;
    constructor(message: string, option?: openai.ErrorOption);
}
