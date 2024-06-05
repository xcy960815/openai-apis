import { OpenAI } from "./index";
import { Core } from "./core";
export default class TextModle extends Core {
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
    sendMessage(text: string, options: OpenAI.TextModel.GetAnswerOptions): Promise<OpenAI.TextModel.AssistantConversation>;
    /**
     * @desc 构建 prompt 获取 maxTokens
     * @param {string} message
     * @param {OpenAI.TextModel.SendMessageOptions} options
     * @returns {Promise<{prompt: string, maxTokens: number}>
     */
    private _getConversationHistory;
}
