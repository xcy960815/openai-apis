import { OpenAI } from "./index";
import { Core } from "./core";
export default class GptModel extends Core {
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
