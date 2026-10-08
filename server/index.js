import { createServer } from 'node:http';
import { openAIProxy } from './openai-proxy.js';

const port = Number(process.env.API_PORT || 3001);
createServer(openAIProxy()).listen(port, '127.0.0.1', () => {
  console.log(`Aura API listening on 127.0.0.1:${port}`);
});
