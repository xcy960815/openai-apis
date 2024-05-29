import { openai } from "./index";
import { PublicModel } from "./public-model";
export default class TextModle extends PublicModel {
    /** 默认请求参数 */
    private _requestParams;
    /** 用户提示前缀 */
    private _userPromptPrefix;
    /** 系统提示前缀 */
    private _systemPromptPrefix;
    /** 会话接口标识符 */
    private _endToken;
    constructor(options: openai.TextModel.TextModelOptions);
    /**
     * @desc 发送请求到openai
     * @param {string} text
     * @param {openai.TextModel.SendMessageOptions} options
     * @returns {Promise<openai.TextModel.Answer>}
     */
    sendMessage(text: string, options: openai.TextModel.SendMessageOptions): Promise<openai.TextModel.AssistantConversationMessage>;
    /**
     * @desc 构建 prompt 获取 maxTokens
     * @param {string} message
     * @param {openai.TextModel.SendMessageOptions} options
     * @returns {Promise<{prompt: string, maxTokens: number}>
     */
    private getConversationMessageHistory;
}
