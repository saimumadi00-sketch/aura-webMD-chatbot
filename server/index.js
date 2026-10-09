/*
 * Production HTTP entry point: bind the API middleware to loopback for a public web server to reverse-proxy.
 */

import { createServer } from 'node:http';
import { openAIProxy } from './openai-proxy.js';

// The public web server forwards API requests to this loopback-only listener.
const port = Number(process.env.API_PORT || 3001);
createServer(openAIProxy()).listen(port, '127.0.0.1', () => {
  console.log(`Aura API listening on 127.0.0.1:${port}`);
});
