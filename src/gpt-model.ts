
import { openai } from "./index"
import { Core } from "./core"

const MODEL = 'gpt-3.5-turbo';

export default class GptModel extends Core {
  /**
   * @desc 请求参数
   */
  private _requestParams: Partial<Omit<openai.GptModel.RequestParams, 'messages' | 'n' | 'stream'>>;

  constructor(options: openai.GptModel.GptModelOptions) {
    const { requestParams, ...coreOptions } = options;
    super(coreOptions, "gpt-model")
    this._requestParams = {
      model: MODEL,
      temperature: 0.8,
      top_p: 1,
      presence_penalty: 1,
      ...requestParams,
    };
  }

  /**
   * @description 构建fetch请求参数
   * @param {openai.GptModel.SendMessageOptions} options
   * @returns {openai.FetchRequestInit}
   */
  private async _getFetchRequestInit(question: string, options: openai.GptModel.SendMessageOptions, assistantMessage: openai.GptModel.AssistantConversationMessage): Promise<openai.FetchRequestInit> {
    const { onProgress, stream = onProgress ? true : false, requestParams } = options
    // 获取用户和gpt历史对话记录
    const { messages, maxTokens } = await this.getConversationMessageHistory(question, options);
    const body = { ...this._requestParams, ...requestParams, messages, stream, max_tokens: maxTokens };
    const requestInit: openai.FetchRequestInit = {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
      signal: this._abortController.signal,
    };
    requestInit.onMessage = (data: string) => {
      if (data === '[DONE]') {
        assistantMessage.content = assistantMessage.content.trim();
        return assistantMessage

      }
      const response: openai.GptModel.Response = JSON.parse(data);
      assistantMessage.messageId = response.id
      if (response?.choices?.length) {
        const delta = response.choices[0].delta;
        if (delta?.content) {
          assistantMessage.content += delta.content;
          if (this._markdown2Html) {
            this._markdownToHtml(assistantMessage.content).then((content) => {
              assistantMessage.content = content
            })
          }
        }
        assistantMessage.detail = response;
        if (delta?.role) {
          assistantMessage.role = delta.role;
        }
        onProgress?.(assistantMessage);
      }
    };
    return requestInit
  }

  /**
   * @desc 发送消息
   * @param {string} question
   * @param {SendMessageOptions} options
   * @returns {Promise<Answer>}
   */
  public async sendMessage(question: string, options: openai.GptModel.SendMessageOptions): Promise<openai.GptModel.AssistantConversationMessage> {
    const { onProgress, stream = onProgress ? true : false } = options
    // 构建用户消息
    const userMessage = this.buildConversationMessage("user", question, options)
    // 保存用户对话
    await this.upsertConversationMessage(userMessage);

    // 构建助手消息
    const assistantMessage = this.buildConversationMessage('gpt-assistant', "", { ...options, messageId: userMessage.messageId })
    // 包装成一个promise 发起请求
    const responseP = new Promise<openai.GptModel.AssistantConversationMessage>(async (resolve, reject) => {

      const requestInit = await this._getFetchRequestInit(question, options, assistantMessage)
      try {
        // 发送数据请求
        const response = await this._getAnswer<openai.GptModel.Response>(this.url, requestInit);
        if (stream) {

          resolve

        }
        else {

        }
        const data = await response?.json();
        if (data?.id) {
          assistantMessage.messageId = data.id;
        }
        if (data?.choices?.length) {
          const message = data.choices[0].message;
          assistantMessage.content = message?.content || '';
          assistantMessage.role = message?.role || 'assistant';
        }
        assistantMessage.detail = data;
        resolve(assistantMessage);
      } catch (error) {
        console.error('OpenAI EventStream error', error);
        return reject(error);
      }


    })
      .then(async (conversationMessage) => {
        return this.upsertConversationMessage(conversationMessage).then(() => {
          conversationMessage.parentMessageId = conversationMessage.messageId;
          return conversationMessage
        })
      });
    // @ts-ignore
    return this.clearablePromise(responseP, {
      milliseconds: this._milliseconds,
    })
  }


  /**
   * @desc 获取会话消息历史
   * @param {string} text
   * @param {Required<openai.GptModel.SendMessageOptions>} options
   * @returns {Promise<{ messages: openai.GptModel.Message[]; }>}
   */
  private async getConversationMessageHistory(text: string, options: openai.GptModel.SendMessageOptions): Promise<{ messages: Array<openai.GptModel.RequestMessage>, maxTokens: number }> {

    const { systemMessage } = options;
    const maxTokenCount = this._maxModelTokens - this._maxResponseTokens;
    // 上次的会话id
    let parentMessageId = options.parentMessageId;

    // 当前系统和用户消息
    const messages: Array<openai.GptModel.RequestMessage> = [
      {
        role: 'system',
        content: systemMessage || this._systemMessage,
      },
      // 用户当前的问题
      {
        role: 'user',
        content: text,
      },
    ];

    let tokenCount = 0;
    let prompt = ""

    while (true && this._withContent) {

      // 计算
      messages.forEach(item => {
        prompt += item.role
        prompt += item.content
      })

      tokenCount = await this.getTokenCount(prompt);

      // 当前 prompt token 数量大于最大 token 数量时，不再向上查找
      if (prompt && tokenCount > maxTokenCount) {
        break;
      }
      if (!parentMessageId) { break; }

      const parentMessage = await this.getConversationMessage(parentMessageId);

      if (!parentMessage) { break; }

      const historyConversationMessage = {
        role: parentMessage.role,
        content: parentMessage.content,
      }
      // 插入会话消息
      messages.splice(1, 0, historyConversationMessage);

      // 上次对话id
      parentMessageId = parentMessage.parentMessageId;
    }

    const maxTokens = Math.max(1, Math.min(this._maxModelTokens - tokenCount, this._maxResponseTokens));

    return { messages, maxTokens };
  }

}
