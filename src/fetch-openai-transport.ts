import 'isomorphic-fetch';

import { createParser, EventSourceParser } from 'eventsource-parser';

import {
  AnswerResponse,
  ChatgptErrorOption,
  FetchRequestInit,
  OpenAITransport,
  OpenAITransportOptions,
} from './sdk-types';
import { ChatgptError } from './chatgpt-error';

export class FetchOpenAITransport implements OpenAITransport {
  private readonly apiKey: string;
  private readonly apiBaseUrl: string;
  private readonly organization?: string;

  constructor(options: OpenAITransportOptions) {
    const { apiKey, apiBaseUrl, baseURL, organization } = options;

    this.apiKey = apiKey;
    this.apiBaseUrl = (apiBaseUrl ?? baseURL ?? 'https://api.openai.com').replace(/\/+$/, '');
    this.organization = organization;
  }

  public async request<R extends object>(
    path: string,
    requestInit: FetchRequestInit,
    abortSignal: AbortSignal,
  ): Promise<AnswerResponse<R> | void> {
    const { onMessage, headers, ...fetchOptions } = requestInit;
    const response = (await fetch(this.buildApiUrl(path), {
      signal: abortSignal,
      ...fetchOptions,
      headers: this.buildHeaders(headers),
    })) as AnswerResponse<R>;

    if (!response.ok) {
      const errorOption: ChatgptErrorOption = {
        url: response.url,
        status: response.status,
        statusText: response.statusText,
      };
      let errorMsg = response.statusText;

      try {
        const data = await response.text();
        const json = JSON.parse(data);

        if (json.error && json.error.message) {
          errorMsg = json.error.message;
        } else {
          errorMsg = data;
        }
      } catch {
        // ignore json parse error, use statusText
      }

      throw new ChatgptError(errorMsg, errorOption);
    }

    if (!onMessage) {
      return response;
    }

    const parser = this.createParser(onMessage);
    const body = response.body;

    if (!body) {
      return;
    }

    for await (const chunk of this.streamAsyncIterable(body)) {
      const chunkString = new TextDecoder().decode(chunk);
      parser.feed(chunkString);
    }
  }

  private buildApiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return this.apiBaseUrl.endsWith('/v1')
      ? `${this.apiBaseUrl}${normalizedPath}`
      : `${this.apiBaseUrl}/v1${normalizedPath}`;
  }

  private buildHeaders(extraHeaders?: HeadersInit): Headers {
    const headers = new Headers({
      Authorization: `Bearer ${this.apiKey}`,
    });

    if (this.organization) {
      headers.set('OpenAI-Organization', this.organization);
    }

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (extraHeaders) {
      const normalizedHeaders = new Headers(extraHeaders);
      normalizedHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    return headers;
  }

  private createParser(onMessage: (message: string) => void): EventSourceParser {
    return createParser((event) => {
      if (event.type === 'event') {
        onMessage(event.data);
      }
    });
  }

  private async *streamAsyncIterable(
    stream: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
  ): AsyncIterable<Uint8Array> {
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
}
