import { openai } from "./index";
import { PublicModel } from "./public-model";
export default class GptModel extends PublicModel {
    /**
     * @desc 请求参数
     */
    private _requestParams;
    constructor(options: openai.GptModel.GptModelOptions);
    /**
     * @desc 发送消息
     * @param {string} question
     * @param {SendMessageOptions} options
     * @returns {Promise<Answer>}
     */
    sendMessage(question: string, options: openai.GptModel.SendMessageOptions): Promise<openai.GptModel.AssistantConversationMessage>;
    /**
     * @desc 获取会话消息历史
     * @param {string} text
     * @param {Required<openai.GptModel.SendMessageOptions>} options
     * @returns {Promise<{ messages: openai.GptModel.Message[]; }>}
     */
    private getConversationMessageHistory;
}
