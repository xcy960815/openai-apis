import { ChatClient } from '../../src/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file in project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.OPENAI_API_KEY;
const apiBaseUrl = process.env.OPENAI_API_BASE_URL;
const model = process.env.OPENAI_MODEL || 'deepseek-chat';

if (!apiKey) {
  console.error('Error: OPENAI_API_KEY not found in .env file');
  process.exit(1);
}

const client = new ChatClient({
  apiKey: apiKey,
  apiBaseUrl: apiBaseUrl,
  debug: true,
  markdown2Html: true,
});

async function main() {
  console.log('--- Testing Non-Streaming Response ---');
  try {
    const res = await client.sendMessage('Hello, who are you?', {
        requestParams: { model }
    });
    console.log('AI Response (HTML):', res.content);
    console.log('Message ID:', res.messageId);
    
    console.log('\n--- Testing Streaming Response ---');
    let lastContentLength = 0;
    await client.sendMessage('Count from 1 to 5', {
      parentMessageId: res.messageId, // Test context
      requestParams: { model },
      onProgress: (partial) => {
        if (partial.content) {
            const delta = partial.content.slice(lastContentLength);
            process.stdout.write(delta); // Print raw stream content
            lastContentLength = partial.content.length;
        }
      }
    });
    console.log('\n\nDone!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
