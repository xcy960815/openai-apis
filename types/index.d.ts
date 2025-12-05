import Gpt3Tokenizer from 'gpt3-tokenizer';

/**
 * @desc ChatGPT 错误类
 */
export declare class ChatgptError extends Error {
    status?: number;
    statusText?: string;
    url?: string;
    constructor(message: string, option?: OpenAI.ChatgptErrorOptions);
}

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

export declare class GptModel extends Core {
    /**
     * @desc 请求参数
     */
    private _requestParams;
    constructor(options: OpenAI.GptModel.GptCoreOptions);
    /**
     * @description 构建fetch公共请求参数
     * @param {string} question
     * @param {OpenAI.GptModel.GetAnswerOptions} options
     * @returns {Promise<OpenAI.FetchRequestInit>}
     */
    private _getFetchRequestInit;
    /**
     * @desc 获取答案
     * @param {string} question
     * @param {OpenAI.GptModel.GetAnswerOptions} options
     * @returns {Promise<OpenAI.GptModel.AssistantConversation>}
     */
    getAnswer(question: string, options: OpenAI.GptModel.GetAnswerOptions): Promise<OpenAI.GptModel.AssistantConversation>;
    /**
     * @desc 获取会话消息历史
     * @param {string} text
     * @param {Required<OpenAI.GptModel.SendMessageOptions>} options
     * @returns {Promise<{ messages: OpenAI.GptModel.Message[]; }>}
     */
    private _getConversationHistory;
}

export declare namespace OpenAI {
    export type ClearablePromiseOptions = {
        milliseconds: number;
        message?: string;
    };
    export interface ChatgptErrorOptions {
        status?: number;
        statusText?: string;
        url?: string;
    }
    /**
     * @desc fetch 请求配置
     */
    export interface FetchRequestInit extends RequestInit {
        onMessage?: (message: string) => void;
    }
    /**
     * @desc 模型公共参数
     */
    export interface CoreOptions {
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
    }
    /**
     * @desc 公共返回usage
     */
    export interface ResponseUsage {
        completion_tokens: number;
        prompt_tokens: number;
        total_tokens: number;
    }
    export type BuildConversationReturns<R extends "user" | "gpt-assistant" | "text-assistant"> = R extends 'user' ? OpenAI.Conversation : R extends 'gpt-assistant' ? OpenAI.GptModel.AssistantConversation : R extends 'text-assistant' ? OpenAI.TextModel.AssistantConversation : undefined;
    export interface Response {
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
     * @desc 公共请求参数
     */
    export interface RequestParams {
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
    }
    /**
     * @desc 公共返回的Choice参数
     */
    export interface ResponseChoice {
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
     * @description 系统、用户、助手（gpt）会话消息
     * @param role 角色 system 给系统设置的人设 user用户 assistant 助手 gpt
     * @param content 对话内容
     * @param messageId 当前对话产生的id
     * @param parentMessageId 上次对话消息id
     */
    export interface Conversation {
        role: Role;
        content: string;
        messageId: string;
        parentMessageId: string;
    }
    /**
     * @desc 公共发送消息选项
     */
    export interface GetAnswerOptions {
        parentMessageId?: string;
        messageId?: string;
        stream?: boolean;
        systemMessage?: string;
    }
    /**
     * @desc 公共角色枚举
     */
    const RoleEnum: {
        readonly System: "system";
        readonly User: "user";
        readonly Assistant: "assistant";
    };
    export type Role = (typeof RoleEnum)[keyof typeof RoleEnum];
    export interface AnswerResponse<T = any> extends globalThis.Response {
        json(): Promise<T>;
    }
    /**
     * @desc gpt 模型模块
     */
    export namespace GptModel {
        export interface RequestMessage extends Omit<OpenAI.Conversation, 'messageId' | 'parentMessageId'> {
        }
        /**
         * @desc 请求参数
         */
        export interface RequestParams extends OpenAI.RequestParams {
            messages: Array<RequestMessage>;
        }
        export interface ResponseMessage {
            role: Role;
            content: string;
        }
        export interface ResponseDelta extends ResponseMessage {
        }
        export interface ResponseChoice extends OpenAI.ResponseChoice {
            message?: ResponseMessage;
            delta: ResponseDelta;
        }
        /**
         * @desc 不走steam流接口的输出结果
         */
        export interface Response extends OpenAI.Response {
            choices: Array<ResponseChoice>;
        }
        export interface AssistantConversation extends OpenAI.Conversation {
            detail?: Response | null;
        }
        export interface GetAnswerOptions extends OpenAI.GetAnswerOptions {
            onProgress?: (partialResponse: AssistantConversation) => void;
            requestParams?: Partial<Omit<RequestParams, 'messages' | 'n' | 'stream'>>;
        }
        export interface GptCoreOptions extends CoreOptions {
            requestParams?: Partial<Omit<RequestParams, 'messages' | 'n' | 'stream'>>;
        }
    }
    export namespace TextModel {
        /**
         * @desc 发送的消息选项
         */
        export interface GetAnswerOptions extends OpenAI.GetAnswerOptions {
            systemPromptPrefix?: string;
            onProgress?: (partialResponse: AssistantConversation) => void;
            requestParams?: Partial<Omit<RequestParams, 'messages' | 'n' | 'stream'>>;
        }
        /**
         * @desc 请求参数
         */
        export interface RequestParams extends OpenAI.RequestParams {
            prompt: string;
            suffix?: string;
            echo?: boolean;
            best_of?: number;
        }
        /**
         * @desc 请求返回
         */
        export interface Response extends OpenAI.Response {
            choices: Array<ResponseChoice>;
        }
        /**
         * @desc 对数概率？？？？
         */
        export interface ResponseLogprobs {
            tokens?: Array<string>;
            token_logprobs?: Array<number>;
            top_logprobs?: Array<object>;
            text_offset?: Array<number>;
        }
        /**
         * @desc 作用未知
         */
        export interface ResponseChoice extends OpenAI.ResponseChoice {
            text?: string;
            logprobs: ResponseLogprobs | null;
        }
        export interface AssistantConversation extends OpenAI.Conversation {
            detail?: Response | null;
        }
        export interface TextCoreOptions extends CoreOptions {
            requestParams?: Partial<RequestParams>;
            userPromptPrefix?: string;
            systemPromptPrefix?: string;
        }
    }

}

export declare class TextModle extends Core {
    /** 默认请求参数 */
    private _requestParams;
    /** 用户提示前缀 */
    private _userPromptPrefix;
    /** 系统提示前缀 */
    private _systemPromptPrefix;
    /** 会话接口标识符 */
    private _endToken;
    constructor(options: OpenAI.TextModel.TextCoreOptions);
    /**
     * @description 构建fetch公共请求参数
     * @param {string} question
     * @param {OpenAI.GptModel.GetAnswerOptions} options
     * @returns {Promise<OpenAI.FetchRequestInit>}
     */
    private _getFetchRequestInit;
    /**
     * @desc 发送请求到OpenAI
     * @param {string} text
     * @param {OpenAI.TextModel.GetAnswerOptions} options
     * @returns {Promise<OpenAI.TextModel.AssistantConversation>}
     */
    getAnswer(text: string, options: OpenAI.TextModel.GetAnswerOptions): Promise<OpenAI.TextModel.AssistantConversation>;
    /**
     * @desc 构建 prompt 获取 maxTokens
     * @param {string} message
     * @param {OpenAI.TextModel.SendMessageOptions} options
     * @returns {Promise<{prompt: string, maxTokens: number}>
         */
     private _getConversationHistory;
    }

    export { }
