

// import pTimeout, { ClearablePromise } from 'p-timeout';
// import { openai } from "./index"
// import { BaseModel } from "./base-model"

// const MODEL = 'text-davinci-003';
// const USER_PROMPT_PREFIX = 'User';
// const SYSTEM_PROMPT_PREFIX_DEFAULT = 'ChatGPT';

// export default class TextModle extends BaseModel {
//     /** 默认请求参数 */
//     private _requestParams: Omit<openai.TextModel.RequestParams, 'prompt'>;
//     /** 用户提示前缀 */
//     private _userPromptPrefix: string;
//     /** 系统提示前缀 */
//     private _systemPromptPrefix: string;
//     /** 会话接口标识符 */
//     private _endToken: string;
//     // private _sepToken: string;

//     constructor(options: openai.TextModel.TextModelOptions) {

//         super(options, "text-model")

//         const { requestParams, userPromptPrefix, systemPromptPrefix } = options;

//         this._requestParams = {
//             model: MODEL,
//             temperature: 0.8,
//             top_p: 1,
//             presence_penalty: 1,
//             ...requestParams,
//         };

//         this._endToken = '<|endoftext|>';

//         // this._sepToken = this._endToken;

//         if (!this._requestParams.stop) {

//             this._requestParams.stop = [this._endToken];

//         }
//         /** 用户前缀 */
//         this._userPromptPrefix = userPromptPrefix || USER_PROMPT_PREFIX;
//         /** 系统前缀 */
//         this._systemPromptPrefix = systemPromptPrefix || SYSTEM_PROMPT_PREFIX_DEFAULT;

//     }

//     /**
//      * @desc 发送请求到openai
//      * @param {string} text
//      * @param {openai.TextModel.SendMessageOptions} options
//      * @returns {Promise<openai.TextModel.Answer>}
//      */
//     public async sendMessage(text: string, options: openai.TextModel.SendMessageOptions): Promise<openai.TextModel.AssistantConversationMessage> {
//         const {
//             timeoutMs,
//             onProgress,
//             stream = onProgress ? true : false,
//             requestParams,
//             abortSignal = timeoutMs ? this._abortController.signal : undefined,
//         } = options;

//         // 构建用户消息
//         const userMessage = this.buildConversationMessage("user", text, options)

//         await this.upsertConversationMessage(userMessage);

//         const { prompt, maxTokens } = await this.getConversationMessageHistory(text, options);

//         // 构建助手消息
//         const assistantMessage = this.buildConversationMessage('text-assistant', "", { ...options, messageId: userMessage.messageId })
//         const responseP = new Promise<openai.TextModel.AssistantConversationMessage>(async (resolve, reject) => {
//             const body = { ...this._requestParams, ...requestParams, prompt, stream, max_tokens: maxTokens };
//             const requestInit: openai.FetchRequestInit = { method: 'POST', headers: this.headers, body: JSON.stringify(body), signal: abortSignal };
//             if (stream) {
//                 requestInit.onMessage = (data: string) => {
//                     if (data === '[DONE]') {
//                         assistantMessage.content = assistantMessage.content.trim();
//                         resolve(assistantMessage);
//                         return;
//                     }
//                     try {
//                         const response: openai.TextModel.Response = JSON.parse(data);
//                         if (response.id) {
//                             assistantMessage.messageId = response.id;
//                         }
//                         if (response?.choices?.length) {
//                             // 这个模型返回的数据是一个字一个字返回的 需要累加操作
//                             assistantMessage.content += response.choices[0].text;
//                             assistantMessage.detail = response;
//                             onProgress?.(assistantMessage);
//                         }
//                     } catch (error) {
//                         console.warn('ChatGPT stream SEE event unexpected error', error);
//                         reject(error);
//                         return;
//                     }
//                 };
//                 await this._getAnswer(this.url, requestInit).catch(reject);
//             }
//             else {
//                 try {
//                     const response = await this._getAnswer<openai.TextModel.Response>(this.url, requestInit);
//                     const data = await response?.json();
//                     if (data?.id) {
//                         assistantMessage.messageId = data.id;
//                     }
//                     if (data?.choices?.length) {
//                         assistantMessage.content = data?.choices[0]?.text?.trim() || '';
//                     }
//                     assistantMessage.detail = data;

//                     resolve(assistantMessage);

//                     return;
//                 } catch (error) {
//                     return reject(error);
//                 }
//             }
//         }).then((conversationMessage) => {
//             return this.upsertConversationMessage(conversationMessage).then(() => {
//                 conversationMessage.parentMessageId = conversationMessage.messageId
//                 return conversationMessage;
//             });
//         });
//         // 超时
//         if (timeoutMs) {
//             return pTimeout(responseP, {
//                 milliseconds: timeoutMs,
//                 signal: abortSignal,
//                 message: 'ChatGPT timed out waiting for response',
//             });
//         } else {
//             return responseP;
//         }
//     }
//     /**
//      * @desc 构建 prompt 获取 maxTokens
//      * @param {string} message
//      * @param {openai.TextModel.SendMessageOptions} options
//      * @returns {Promise<{prompt: string, maxTokens: number}>
//      */
//     private async getConversationMessageHistory(message: string, options: openai.TextModel.SendMessageOptions): Promise<{
//         prompt: string;
//         maxTokens: number;
//     }> {
//         const systemMessage = `System:${options.systemMessage || this._systemMessage}${this._endToken}`;
//         // 系统提示符前缀
//         const systemPromptPrefix = options.systemPromptPrefix || `${this._systemPromptPrefix}:`;
//         const maxTokenCount = this._maxModelTokens - this._maxResponseTokens;
//         let parentMessageId = options.parentMessageId;
//         // 当前用户消息
//         const currentUserPrompt = `${this._userPromptPrefix}:${message}${this._endToken}`;
//         // 历史消息
//         let historyPrompt = '';

//         let tokenCount = 0;

//         while (true && this._withContent) {
//             const prompt = `${systemMessage}${historyPrompt}${currentUserPrompt}${systemPromptPrefix}`;
//             tokenCount = await this.getTokenCount(prompt);
//             // 当前 prompt token 数量大于最大 token 数量时，不再向上查找
//             if (prompt && tokenCount > maxTokenCount) {
//                 break;
//             }
//             if (!parentMessageId) {
//                 break;
//             }
//             const parentMessage = await this.getConversationMessage(parentMessageId);
//             if (!parentMessage) {
//                 break
//             };
//             const parentMessageRole = parentMessage.role;
//             const parentMessagePromptPrefix = parentMessageRole === 'user' ? this._userPromptPrefix : this._systemPromptPrefix;
//             // 历史消息
//             const parentMessagePrompt = `${parentMessagePromptPrefix}:${parentMessage.content}${this._endToken}`;
//             historyPrompt = `${parentMessagePrompt}${historyPrompt}`;
//             parentMessageId = parentMessage.parentMessageId;
//         }

//         const prompt = `${systemMessage}${historyPrompt}${currentUserPrompt}${systemPromptPrefix}`;

//         const maxTokens = Math.max(1, Math.min(this._maxModelTokens - tokenCount, this._maxResponseTokens));

//         return { prompt, maxTokens };
//     }

// }


