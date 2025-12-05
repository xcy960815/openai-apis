import { GptModel } from '../../src/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('Error: OPENAI_API_KEY not found in .env file');
  process.exit(1);
}

const gpt = new GptModel({
  apiKey: apiKey,
  debug: true,
  requestParams: {
    model: 'gpt-3.5-turbo',
  },
});

// Define a mock tool
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_current_weather',
      description: 'Get the current weather in a given location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA',
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
          },
        },
        required: ['location'],
      },
    },
  },
];

// Mock function implementation
function getCurrentWeather(location: string, unit: string = 'celsius') {
  console.log(`[Mock Tool] Getting weather for ${location} in ${unit}...`);
  return JSON.stringify({
    location: location,
    temperature: '22',
    unit: unit,
    forecast: ['sunny', 'windy'],
  });
}

async function main() {
  console.log('--- Testing Function Calling ---');
  
  try {
    // 1. Send user message with tools
    console.log('User: What is the weather in Shanghai?');
    const res1 = await gpt.getAnswer('What is the weather in Shanghai?', {
      requestParams: {
        tools: tools as any,
        tool_choice: 'auto',
      }
    });

    console.log('Assistant Response 1:', res1);

    // 2. Check if the model wants to call a tool
    if (res1.tool_calls && res1.tool_calls.length > 0) {
      const toolCall = res1.tool_calls[0];
      console.log('Tool Call Requested:', toolCall.function.name);
      
      if (toolCall.function.name === 'get_current_weather') {
        const args = JSON.parse(toolCall.function.arguments);
        const functionResult = getCurrentWeather(args.location, args.unit);

        // 3. Send tool result back to the model
        // We need to pass the tool result with role 'tool' and the tool_call_id
        console.log('Sending tool result back to model...');
        
        const res2 = await gpt.getAnswer(functionResult, {
          parentMessageId: res1.messageId,
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
        });

        console.log('Assistant Final Response:', res2.content);
      }
    } else {
      console.log('No tool call requested.');
      console.log('Content:', res1.content);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
