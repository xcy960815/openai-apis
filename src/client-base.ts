import { ClientBaseOptions, Conversation, Role, BaseSendMessageOptions, BuildConversationReturns, FetchRequestInit, AnswerResponse, ChatgptErrorOption, ClearablePromiseOptions, ListModelsResponse } from "./types"
import 'isomorphic-fetch'
import { createParser, EventSourceParser } from 'eventsource-parser';
import { v4 as uuidv4 } from "uuid"
import Gpt3Tokenizer from 'gpt3-tokenizer';
import { marked } from 'marked';

/**
 * @description 基础类 有一些公共方法
 *
 */
export class ClientBase {
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
    protected messageStore: Map<string, Conversation>
    /** 最大请求token */
    protected maxModelTokens: number;
    /** 最多返回token */
    protected maxResponseTokens: number;
    /** 系统角色 */
    protected systemMessage: string
    /** 取消fetch请求控制器 */
    protected abortController: AbortController
    /** 用于计算token */
    protected gpt3Tokenizer: Gpt3Tokenizer;
    /** 超时时间 */
    protected milliseconds: number
    /** 是否将markdown语法转换成html */
    protected markdown2Html: boolean

    constructor(options: ClientBaseOptions) {

        const { apiKey, apiBaseUrl, organization, debug, withContent, maxModelTokens, maxResponseTokens, systemMessage, milliseconds, markdown2Html } = options;

        this.apiKey = apiKey;

        this.apiBaseUrl = apiBaseUrl ?? 'https://api.OpenAI.com';

        this.organization = organization;

        this.debug = !!debug;

        this.withContent = withContent ?? true;

        this.maxModelTokens = maxModelTokens ?? 4096;

        this.maxResponseTokens = maxResponseTokens ?? 1000;

        this.messageStore = new Map<string, Conversation>()

        this.gpt3Tokenizer = new Gpt3Tokenizer({ type: 'gpt3' });

        this.systemMessage = systemMessage ?? ` 你是ChatGPT,帮助用户使用代码。您聪明、乐于助人、专业的开发人员，总是给出正确的答案，并且只按照指示执行。你的回答始终如实，不会造假`

        this.abortController = new AbortController()

        this.milliseconds = milliseconds ?? 1000 * 60

        this.markdown2Html = !!markdown2Html
    }

    /**
     * @desc 解析markdown
     * @param {string} text
     * @returns {string}
     */
    protected parseMarkdown(text: string): string {
        return this.markdown2Html ? marked(text) as string : text;
    }

    /**
     * @desc models 请求地址
     * @returns {string}
     */
    protected get modelUrl(): string {
        return `${this.apiBaseUrl}${'/v1/models'}`
    }

    /**
     * @desc 生成随机id
     * @returns {string}
     */
    protected get uuid(): string {
        return uuidv4()
    }

    /**
     * @desc 请求头
     * @returns {HeadersInit}
     */
    protected get headers(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
        };
        if (this.organization) {
            headers['OpenAI-Organization'] = this.organization;
        }
        return headers;
    }
    /**
     * @desc 获取token数量
     * @param {string} text
     * @returns {Promise<number>}
     */
    protected async getTokenCount(_text: string): Promise<number> {
        return await this.gpt3Tokenizer.encode(_text).bpe.length;
    }

    /**
     * @description 构建会话消息
     * @param {"user" | "gpt-assistant"} role 
     * @param {string} content 
     * @param {BaseSendMessageOptions} option 
     * @returns {Conversation}
     */
    protected buildConversation<R extends Role | "gpt-assistant">(
        role: R,
        content: string,
        option: BaseSendMessageOptions
    ): BuildConversationReturns<R> {
        const _content = this.parseMarkdown(content);
        if (role === 'user' || role === 'tool' || role === 'function' || role === 'system') {
            return {
                role: role as Role,
                messageId: option.messageId || this.uuid,
                parentMessageId: option.parentMessageId,
                content: _content,
                tool_call_id: option.tool_call_id,
                name: option.name,
            } as BuildConversationReturns<R>;
        } else if (role === 'gpt-assistant') {
            return {
                role: "assistant",
                messageId: "",
                parentMessageId: option.messageId || this.uuid,
                content: _content,
                detail: null
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
        return new Promise((resolve) => {
            const message = this.messageStore.get(id)
            resolve(message)
        })
    }
    /**
     * @desc 更新对话
     * @param {Conversation} message
     * @returns {Promise<void>}
     */
    protected upsertConversation(message: Conversation): Promise<void> {
        return new Promise((resolve) => {
            // 这里做层浅拷贝 因为map存储的值如果是对象的话 会受到指针的影响
            this.messageStore.set(message?.messageId, { ...message })
            resolve()
        })
    }
    /**
     * @desc 清空消息
     * @returns {Promise<void>}
     */
    protected clearMessage(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.messageStore.clear()
            resolve()
        })
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
     * 这个方法的作用是将一个 ReadableStream 对象转换成一个异步迭代器 AsyncIterable，
     * 该迭代器会在每次迭代中返回一个 Uint8Array 类型的数据块。具体来说，该方法会获取一个 ReadableStream 对象的读取器（reader），
     * 然后在一个无限循环中等待读取器返回数据。每次读取器返回数据时，该方法都会返回一个包含数据的 Uint8Array 对象。
     * 当读取器返回一个 done 属性为 true 的对象时，该方法就会结束迭代。最后，该方法会释放读取器的锁。
     * @param {ReadableStream<Uint8Array>} stream
     * @returns {AsyncIterable<Uint8Array>}
     */
    private async *streamAsyncIterable(stream: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>): AsyncIterable<Uint8Array> {
        if ('getReader' in stream) {
            const reader = stream.getReader();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        return;
                    }
                    yield value!;
                }
            } finally {
                reader.releaseLock();
            }
        } else {
            for await (const chunk of stream) {
                yield chunk;
            }
        }
    }
    /**
     * @desc 向OpenAI发送请求
     * @param {string} url 
     * @param {FetchSSEOptions} options
     * @returns {Promise<GptResponse<R> | void>}
     */
    protected async fetchSSE<R extends Object>(url: string, requestInit: FetchRequestInit): Promise<AnswerResponse<R> | void> {
        const { onMessage, ...fetchOptions } = requestInit;
        const response = await fetch(url, { signal: this.abortController.signal, ...fetchOptions }) as AnswerResponse<R>
        if (!response.ok) {
            // 走到这一步是OpenAI接口错误的时候 如果其他后端应用封装了OpenAI接口即使发生错误也不一定 走到这步 
            const errorOption: ChatgptErrorOption = {
                url: response.url,
                status: response.status,
                statusText: response.statusText
            }
            let errorMsg = response.statusText;
            try {
                const data = await response.text();
                const json = JSON.parse(data);
                if (json.error && json.error.message) {
                    errorMsg = json.error.message;
                } else {
                    errorMsg = data;
                }
            } catch (e) {
                // ignore json parse error, use statusText
            }
            throw new ChatgptError(errorMsg, errorOption)
        }
        // 如果没有 onMessage 回调函数，直接返回 response
        if (!onMessage) {
            return response;
        }
        const parser = this.createParser(onMessage);
        const body = response.body;
        if (!body) return;
        
        for await (const chunk of this.streamAsyncIterable(body)) {
            const chunkString = new TextDecoder().decode(chunk);
            parser.feed(chunkString);
        }
    }
    /**
     * @description 创建parser
     * @param {(p:string)=>void} onMessage 
     * @returns {EventSourceParser}
     */
    private createParser(onMessage: (p: string) => void): EventSourceParser {
        return createParser((event) => {
            if (event.type === 'event') {
                onMessage?.(event.data);
            }
        })
    };



    /**
     * @description 清空promise
     */
    protected clearablePromise<V = any>(inputPromise: PromiseLike<V>, options: ClearablePromiseOptions) {
        const { milliseconds, message } = options
        let timer: ReturnType<typeof setTimeout> | undefined
        const wrappedPromise = new Promise<V>((resolve, reject) => {
            if (milliseconds === Number.POSITIVE_INFINITY) {
                inputPromise.then(resolve, reject)
                return
            }
            try {
                timer = setTimeout.call(undefined, () => {
                    // 终止请求
                    this.abortController.abort()
                    this.abortController = new AbortController()
                    const errorMessage = message ?? `Promise timed out after ${milliseconds} milliseconds`
                    const timeoutError = new ChatgptError(errorMessage)
                    reject(timeoutError)
                }, milliseconds)

            } catch (error) {
                reject(error)
            } finally {
                inputPromise.then(
                    (inputPromiseResult) => {
                        resolve(inputPromiseResult)
                    },
                    (error) => {
                        reject(error)
                    }
                )
            }
        })

        /**
         * @desc 默认清除定时器
         */
        const cancelablePromise = wrappedPromise.finally(() => {
            clearTimeout.call(undefined, timer)
            timer = undefined
        })

        return cancelablePromise
    }
    /**
     * @desc 取消对话
     * @param {string}reson
     * @returns {void}
     */
    public cancelConversation(reson?: string) {
        this.abortController.abort(reson)
        this.abortController = new AbortController()
    }


    public getModels() {
        const requestInit = { method: 'GET', headers: this.headers }
        return this.fetchSSE<ListModelsResponse>(this.modelUrl, requestInit)
    }
}




/**
 * @desc ChatGPT 错误类
 */
export class ChatgptError extends Error {
    status?: number;
    statusText?: string;
    url?: string;
    constructor(message: string, option?: ChatgptErrorOption) {
        super(message)
        if (option) {
            const { status, statusText, url } = option
            this.status = status
            this.statusText = statusText
            this.url = url
        }
    }
}
