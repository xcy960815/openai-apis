import GptModel from '../gpt-model';



// Mock fetch
global.fetch = jest.fn();

// Mock marked to avoid ESM issues
jest.mock('marked', () => ({
  marked: (text: string) => `<strong>${text.replace(/\*\*/g, '')}</strong>`,
}));

describe('GptModel', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('should return HTML when markdown2Html is true (non-streaming)', async () => {
    const mockResponse = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: 1677652288,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: '**Hello**',
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: 9,
        completion_tokens: 12,
        total_tokens: 21,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      text: async () => JSON.stringify(mockResponse),
    });

    const gpt = new GptModel({
      apiKey: 'test-key',
      markdown2Html: true,
    });

    const res = await gpt.getAnswer('hi', {});
    
    // marked output usually contains the HTML tags
    expect(res.content).toContain('<strong>Hello</strong>');
  });
});
