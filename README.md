# @song940/openai

> OpenAI JS SDK

## Installation

```bash
npm install @song940/openai
```

## Usage

***Demo: <https://lsong.org/chatgpt-demo>***

```js
import { OpenAI } from '@song940/openai';
import { OpenAI } from 'https://lsong.org/chatgpt-demo/openai.js';

const openai = new OpenAI({
  api: 'https://oai.lsong.org/v1',
  apiKey: 'YOUR_API_KEY',
});

const response = await openai.createChatCompletion({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0].message.content);

// or stream

const response = openai.createChatCompletion({
  stream: true,
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello!' }],
});

for await (const part of response) {
  console.log(part.choices[0]?.delta?.content);
}
```

## License

MIT License