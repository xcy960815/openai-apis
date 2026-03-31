import { ChatClient } from '../chat-client';
import { InMemoryConversationStore } from '../in-memory-conversation-store';
import { TokenCountOptions } from '../sdk-types';

const mockedFetch = jest.fn();

globalThis.fetch = mockedFetch as unknown as typeof fetch;

jest.mock('marked', () => ({
  marked: (text: string) => `<strong>${text.replace(/\*\*/g, '')}</strong>`,
}));

function createJsonResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  };
}

function createSseResponse(events: Array<unknown>) {
  const encoder = new TextEncoder();

  return {
    ok: true,
    body: (async function* () {
      for (const event of events) {
        const data = typeof event === 'string' ? event : JSON.stringify(event);
        yield encoder.encode(`data: ${data}\n\n`);
      }
    })(),
    text: async () => '',
  };
}

describe('ChatClient', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it('returns HTML when markdown2Html is true for non-streaming responses', async () => {
    const mockResponse = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: 1677652288,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '**Hello**',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 9,
        completion_tokens: 12,
        total_tokens: 21,
      },
    };

    mockedFetch.mockResolvedValue(createJsonResponse(mockResponse));

    const client = new ChatClient({
      apiKey: 'test-key',
      markdown2Html: true,
    });

    const res = await client.sendMessage('hi');

    expect(res.content).toContain('<strong>Hello</strong>');
  });

  it('streams incremental content and resolves the final assistant response', async () => {
    mockedFetch.mockResolvedValue(
      createSseResponse([
        {
          id: 'chatcmpl-stream',
          object: 'chat.completion.chunk',
          created: 1677652288,
          model: 'gpt-5-mini',
          choices: [
            {
              index: 0,
              delta: {
                role: 'assistant',
                content: 'Hel',
              },
            },
          ],
        },
        {
          id: 'chatcmpl-stream',
          object: 'chat.completion.chunk',
          created: 1677652289,
          model: 'gpt-5-mini',
          choices: [
            {
              index: 0,
              delta: {
                content: 'lo',
              },
            },
          ],
        },
        '[DONE]',
      ]),
    );

    const snapshots: Array<string | null> = [];
    const onProgress = jest.fn((partialResponse) => {
      snapshots.push(partialResponse.content);
    });
    const client = new ChatClient({ apiKey: 'test-key' });

    const res = await client.sendMessage('Say hello', { onProgress });

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(snapshots).toEqual(['Hel', 'Hello']);
    expect(res.content).toBe('Hello');
    expect(res.messageId).toBe('chatcmpl-stream');
  });

  it('normalizes baseURL, uses the modern default model, and preserves raw history content', async () => {
    const requestBodies: Array<any> = [];
    const requestUrls: Array<string> = [];
    const responses = [
      {
        id: 'chatcmpl-first',
        object: 'chat.completion',
        created: 1677652288,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Nice to meet you, **Ada**.',
            },
            finish_reason: 'stop',
          },
        ],
      },
      {
        id: 'chatcmpl-second',
        object: 'chat.completion',
        created: 1677652290,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Your name is Ada.',
            },
            finish_reason: 'stop',
          },
        ],
      },
    ];

    mockedFetch.mockImplementation(async (url: string, init?: RequestInit) => {
      requestUrls.push(url);
      requestBodies.push(JSON.parse(String(init?.body)));
      return createJsonResponse(responses.shift());
    });

    const client = new ChatClient({
      apiKey: 'test-key',
      baseURL: 'https://api.openai.com/v1',
      conversationStore: new InMemoryConversationStore(),
      markdown2Html: true,
    });

    const firstResponse = await client.sendMessage('My name is **Ada**');
    await client.sendMessage('What is my name?', {
      parentMessageId: firstResponse.messageId,
    });

    expect(requestUrls[0]).toBe('https://api.openai.com/v1/chat/completions');
    expect(requestBodies[0].model).toBe('gpt-5-mini');
    expect(requestBodies[1].messages.map((message: { role: string }) => message.role)).toEqual([
      'user',
      'assistant',
      'user',
    ]);
    expect(requestBodies[1].messages[0].content).toBe('My name is **Ada**');
    expect(requestBodies[1].messages[1].content).toBe('Nice to meet you, **Ada**.');
    expect(firstResponse.parentMessageId).toBeDefined();
    expect(firstResponse.parentMessageId).not.toBe(firstResponse.messageId);
  });

  it('is stateless by default and requires an explicit store for follow-up history', async () => {
    const requestBodies: Array<any> = [];
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      mockedFetch.mockImplementation(async (_url: string, init?: RequestInit) => {
        requestBodies.push(JSON.parse(String(init?.body)));
        return createJsonResponse({
          id: 'chatcmpl-first',
          object: 'chat.completion',
          created: 1677652288,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Nice to meet you, Ada.',
              },
              finish_reason: 'stop',
            },
          ],
        });
      });

      const client = new ChatClient({ apiKey: 'test-key' });
      const firstResponse = await client.sendMessage('My name is Ada');

      await expect(
        client.sendMessage('What is my name?', {
          parentMessageId: firstResponse.messageId,
        }),
      ).rejects.toThrow(
        'parentMessageId requires a conversationStore. Pass conversationStore or withContent: true to enable history.',
      );

      expect(requestBodies).toHaveLength(1);
      expect(requestBodies[0].messages.map((message: { role: string }) => message.role)).toEqual([
        'user',
      ]);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('sends tool results back with role tool instead of rewriting them as user messages', async () => {
    const requestBodies: Array<any> = [];
    const toolCall = {
      id: 'call_weather_1',
      type: 'function' as const,
      function: {
        name: 'get_current_weather',
        arguments: '{"location":"Shanghai"}',
      },
    };

    const responses = [
      {
        id: 'chatcmpl-tool-request',
        object: 'chat.completion',
        created: 1677652288,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [toolCall],
            },
            finish_reason: 'tool_calls',
          },
        ],
      },
      {
        id: 'chatcmpl-tool-answer',
        object: 'chat.completion',
        created: 1677652290,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'It is 22C and sunny.',
            },
            finish_reason: 'stop',
          },
        ],
      },
    ];

    mockedFetch.mockImplementation(async (_url: string, init?: RequestInit) => {
      requestBodies.push(JSON.parse(String(init?.body)));
      return createJsonResponse(responses.shift());
    });

    const client = new ChatClient({
      apiKey: 'test-key',
      conversationStore: new InMemoryConversationStore(),
    });
    const firstResponse = await client.sendMessage('What is the weather in Shanghai?', {
      requestParams: {
        tools: [
          {
            type: 'function',
            function: {
              name: 'get_current_weather',
            },
          },
        ],
        tool_choice: 'auto',
      },
    });

    await client.sendMessage('{"temperature":"22","forecast":["sunny"]}', {
      parentMessageId: firstResponse.messageId,
      role: 'tool',
      tool_call_id: toolCall.id,
      name: toolCall.function.name,
    });

    expect(requestBodies[1].messages.map((message: { role: string }) => message.role)).toEqual([
      'user',
      'assistant',
      'tool',
    ]);
    expect(requestBodies[1].messages[1].tool_calls).toEqual([toolCall]);
    expect(requestBodies[1].messages[2]).toMatchObject({
      role: 'tool',
      content: '{"temperature":"22","forecast":["sunny"]}',
      tool_call_id: 'call_weather_1',
      name: 'get_current_weather',
    });
  });

  it('passes the selected model through to the token counter', async () => {
    const observedOptions: Array<TokenCountOptions | undefined> = [];
    const tokenCounter = {
      count: jest.fn(async (_text: string, options?: TokenCountOptions) => {
        observedOptions.push(options);
        return 1;
      }),
    };

    mockedFetch.mockResolvedValue(
      createJsonResponse({
        id: 'chatcmpl-model-aware',
        object: 'chat.completion',
        created: 1677652288,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Done.',
            },
            finish_reason: 'stop',
          },
        ],
      }),
    );

    const client = new ChatClient({
      apiKey: 'test-key',
      tokenCounter,
    });

    await client.sendMessage('Hello', {
      requestParams: {
        model: 'gpt-4o-mini',
      },
    });

    expect(tokenCounter.count).toHaveBeenCalled();
    expect(observedOptions.every((options) => options?.model === 'gpt-4o-mini')).toBe(true);
  });
});
