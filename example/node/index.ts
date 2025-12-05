import { GptModel } from '../../src/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file in project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('Error: OPENAI_API_KEY not found in .env file');
  process.exit(1);
}

const gpt = new GptModel({
  apiKey: apiKey,
  debug: true,
  markdown2Html: true,
});

async function main() {
  console.log('--- Testing Non-Streaming Response ---');
  try {
    const res = await gpt.getAnswer('Hello, who are you?', {});
    console.log('AI Response (HTML):', res.content);
    console.log('Message ID:', res.messageId);
    
    console.log('\n--- Testing Streaming Response ---');
    let lastContentLength = 0;
    await gpt.getAnswer('Count from 1 to 5', {
      parentMessageId: res.messageId, // Test context
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
