import { GptModel } from '../../src/index';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

// Load environment variables from .env file in project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('Error: OPENAI_API_KEY not found in .env file');
  console.error('Please create a .env file in the root directory with your OPENAI_API_KEY');
  process.exit(1);
}

const gpt = new GptModel({
  apiKey: apiKey,
  debug: false, // Disable debug for cleaner CLI output
  markdown2Html: false, // CLI usually prefers raw text
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'You: '
});

console.log('--- OpenAI CLI Test Environment ---');
console.log('Type your message and press Enter. Type "exit" or "quit" to leave.');
console.log('-----------------------------------');

let parentMessageId: string | undefined = undefined;

rl.prompt();

rl.on('line', async (line) => {
  const input = line.trim();
  
  if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
    rl.close();
    return;
  }

  if (!input) {
    rl.prompt();
    return;
  }

  try {
    process.stdout.write('AI: ');
    
    let lastContentLength = 0;

    // Use streaming response
    const res = await gpt.getAnswer(input, {
      parentMessageId: parentMessageId,
      onProgress: (partial) => {
        if (partial.content) {
          const delta = partial.content.slice(lastContentLength);
          process.stdout.write(delta);
          lastContentLength = partial.content.length;
        }
      }
    });

    // Update parentMessageId for context
    parentMessageId = res.messageId;
    
    // Add a newline after the stream finishes
    process.stdout.write('\n');
    
  } catch (error: any) {
    console.error('\nError:', error.message || error);
  }

  rl.prompt();
}).on('close', () => {
  console.log('\nGoodbye!');
  process.exit(0);
});
