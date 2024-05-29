import GptModel from "./gpt-model";
import TextModle from "./text-model";
import { ChatgptError } from "./public-model";
export { GptModel, TextModle, ChatgptError };
export declare namespace openai {
    export interface ErrorOption {
        status?: number;
        statusText?: string;
        url?: string;
    }
    export type Fetch = typeof global.fetch;
    /**
     * @desc fetch 请求配置
     */
    export interface FetchRequestInit extends RequestInit {
        onMessage?: (message: string) => void;
    }
    /**
     * @desc 模型公共参数
     */
    export interface ModelOptions {
        apiKey: string;
        /** 请求连接 default https://api.openai.com */
        apiBaseUrl?: string;
        organization?: string;
        /** 是否开启debug模式 */
        debug?: boolean;
        fetch?: Fetch;
        /** @defaultValue 4096 **/
        maxModelTokens?: number;
        /** @defaultValue 1000 **/
        maxResponseTokens?: number;
        /** 是否携带上下文 */
        withContent?: boolean;
        /** 系统消息 */
        systemMessage?: string;
    }
    /**
     * @desc 公共返回usage
     */
    export interface ResponseUsage {
        completion_tokens: number;
        prompt_tokens: number;
        total_tokens: number;
    }
    export type BuildConversationMessageReturns<R extends "user" | "gpt-assistant" | "text-assistant"> = R extends 'user' ? openai.ConversationMessage : R extends 'gpt-assistant' ? openai.GptModel.AssistantConversationMessage : R extends 'text-assistant' ? openai.TextModel.AssistantConversationMessage : undefined;
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
    export interface ConversationMessage {
        role: "user" | 'assistant' | 'system';
        content: string;
        messageId: string;
        parentMessageId: string;
    }
    /**
     * @desc 公共发送消息选项
     */
    export interface SendMessageOptions {
        parentMessageId?: string;
        messageId?: string;
        stream?: boolean;
        systemMessage?: string;
        timeoutMs?: number;
        abortSignal?: AbortSignal;
    }
    /**
     * @desc 公共角色枚举
     */
    export const RoleEnum: {
        readonly System: "system";
        readonly User: "user";
        readonly Assistant: "assistant";
    };
    type Role = (typeof RoleEnum)[keyof typeof RoleEnum];
    export interface AnswerResponse<T = any> extends globalThis.Response {
        json(): Promise<T>;
    }
    /**
     * @desc gpt 模型模块
     */
    export namespace GptModel {
        interface RequestMessage extends Omit<openai.ConversationMessage, 'messageId' | 'parentMessageId'> {
        }
        /**
         * @desc 请求参数
         */
        interface RequestParams extends openai.RequestParams {
            messages: Array<RequestMessage>;
        }
        interface ResponseMessage {
            role: Role;
            content: string;
        }
        interface ResponseDelta extends ResponseMessage {
        }
        interface ResponseChoice extends openai.ResponseChoice {
            message?: ResponseMessage;
            delta: ResponseDelta;
        }
        /**
         * @desc 不走steam流接口的输出结果
         */
        interface Response extends openai.Response {
            choices: Array<ResponseChoice>;
        }
        interface AssistantConversationMessage extends openai.ConversationMessage {
            detail?: Response | null;
        }
        interface SendMessageOptions extends openai.SendMessageOptions {
            onProgress?: (partialResponse: AssistantConversationMessage) => void;
            requestParams?: Partial<Omit<RequestParams, 'messages' | 'n' | 'stream'>>;
        }
        interface GptModelOptions extends ModelOptions {
            requestParams?: Partial<Omit<RequestParams, 'messages' | 'n' | 'stream'>>;
        }
    }
    export namespace TextModel {
        /**
         * @desc 发送的消息选项
         */
        interface SendMessageOptions extends openai.SendMessageOptions {
            systemPromptPrefix?: string;
            onProgress?: (partialResponse: AssistantConversationMessage) => void;
            requestParams?: Partial<Omit<RequestParams, 'messages' | 'n' | 'stream'>>;
        }
        /**
         * @desc 请求参数
         */
        interface RequestParams extends openai.RequestParams {
            prompt: string;
            suffix?: string;
            echo?: boolean;
            best_of?: number;
        }
        /**
         * @desc 请求返回
         */
        interface Response extends openai.Response {
            choices: Array<ResponseChoice>;
        }
        /**
         * @desc 对数概率？？？？
         */
        interface ResponseLogprobs {
            tokens?: Array<string>;
            token_logprobs?: Array<number>;
            top_logprobs?: Array<object>;
            text_offset?: Array<number>;
        }
        /**
         * @desc 作用未知
         */
        interface ResponseChoice extends openai.ResponseChoice {
            text?: string;
            logprobs: ResponseLogprobs | null;
        }
        interface AssistantConversationMessage extends openai.ConversationMessage {
            detail?: Response | null;
        }
        interface TextModelOptions extends ModelOptions {
            requestParams?: Partial<RequestParams>;
            userPromptPrefix?: string;
            systemPromptPrefix?: string;
        }
    }
    export {};
}
