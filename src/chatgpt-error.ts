import { ChatgptErrorOption } from './sdk-types';

/**
 * @desc ChatGPT 错误类
 */
export class ChatgptError extends Error {
  status?: number;
  statusText?: string;
  url?: string;

  constructor(message: string, option?: ChatgptErrorOption) {
    super(message);

    if (option) {
      const { status, statusText, url } = option;
      this.status = status;
      this.statusText = statusText;
      this.url = url;
    }
  }
}
