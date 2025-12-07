export type ClearablePromiseOptions = {
    milliseconds: number
    message?: string
}

export interface ChatgptErrorOption {
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
export interface ClientBaseOptions {
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
 * @desc 公共返回usage
 */
export interface ResponseUsage {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
}


export interface AssistantConversation extends Conversation {
    detail?: ChatResponse | null;
}

export type BuildConversationReturns<R extends Role | "gpt-assistant"> =
    R extends 'user'
    ? Conversation
    : R extends 'gpt-assistant'
    ? AssistantConversation
    : R extends 'tool'
    ? Conversation
    : R extends 'function'
    ? Conversation
    : undefined;


export interface BaseResponse {
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
export interface BaseRequestParams {
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
    tool_choice?: string | { type: 'function'; function: { name: string } };
}

/**
 * @desc 公共返回的Choice参数
 */
export interface BaseResponseChoice {
    /** 下标 */
    index?: number;
    /** 结束原因 */
    finish_reason?: string | null;
    /** 参数未知 作用未知 */
    content_filter_results?: {
        hate: { filtered: boolean, severity: string }
        self_harm: { filtered: boolean, severity: string }
        sexual: { filtered: boolean, severity: string }
        violence: { filtered: boolean, severity: string }
    }
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
    content: string | null;
    messageId: string;
    parentMessageId: string;
    name?: string;
    tool_calls?: Array<ToolCall>;
    tool_call_id?: string;
    function_call?: FunctionCall;
}

/**
 * @desc 公共发送消息选项
 */
export interface BaseSendMessageOptions {
    parentMessageId?: string;
    messageId?: string;
    stream?: boolean;
    systemMessage?: string;
    role?: Role;
    tool_call_id?: string;
    name?: string;
}
/**
 * @desc 公共角色枚举
 */
export enum RoleEnum {
    System = 'system',
    User = 'user',
    Assistant = 'assistant',
}
export type Role = 'system' | 'user' | 'assistant' | 'tool' | 'function';

/**
 * @desc Function definition
 */
export interface FunctionDef {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
}

/**
 * @desc Tool definition
 */
export interface Tool {
    type: 'function';
    function: FunctionDef;
}

/**
 * @desc Tool call in response
 */
export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export interface FunctionCall {
    name: string;
    arguments: string;
}


export interface AnswerResponse<T = any> extends globalThis.Response {
    json(): Promise<T>;
}

// ChatClient Types

export interface ChatRequestMessage extends Omit<Conversation, 'messageId' | 'parentMessageId'> { }

/**
 * @desc 请求参数
 */
export interface ChatRequestParams extends BaseRequestParams {
    messages: Array<ChatRequestMessage>;
}

export interface ChatResponseMessage {
    role: Role;
    content: string | null;
    tool_calls?: Array<ToolCall>;
}

export interface ChatResponseDelta extends ChatResponseMessage {
    tool_calls?: Array<ToolCall>;
}

export interface ChatResponseChoice extends BaseResponseChoice {
    message?: ChatResponseMessage;
    delta: ChatResponseDelta;
}

/**
 * @desc 不走steam流接口的输出结果
 */
export interface ChatResponse extends BaseResponse {
    choices: Array<ChatResponseChoice>;
    // detail?: ResponseDetail;
}

export interface ChatSendMessageOptions extends BaseSendMessageOptions {
    onProgress?: (partialResponse: AssistantConversation) => void;
    requestParams?: Partial<Omit<ChatRequestParams, 'messages' | 'n' | 'stream'>>;
}
export interface ChatClientOptions extends ClientBaseOptions {
    requestParams?: Partial<Omit<ChatRequestParams, 'messages' | 'n' | 'stream'>>;
}

export interface Model {
    id: string;
    object: string;
    owned_by: string;
}

export interface ListModelsResponse {
    object: string;
    data: Array<Model>;
}
