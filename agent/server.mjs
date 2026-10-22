import http from 'node:http';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { completeWithGemini, systemPrompt, toGeminiContents } from './gemini.mjs';
import {
  catalogFromContext,
  contentText,
  interpretQuestion,
  sanitizeCriteria,
  summarizeToolResult,
} from './interpret.mjs';

const TOOL_NAME = 'applyCustomerSearch';

loadEnv(new URL('../.env', import.meta.url));

export function createAgentServer() {
  return http.createServer(async (req, res) => {
    if (req.method === 'GET' && (req.url === '/health' || req.url === '/ag-ui/health')) {
      sendJson(res, 200, { ok: true, gemini: Boolean(process.env.GEMINI_API_KEY?.trim()) });
      return;
    }
    if (req.method === 'POST' && req.url?.startsWith('/ag-ui')) {
      let input;
      try {
        input = JSON.parse((await readBody(req)) || '{}');
      } catch {
        sendJson(res, 400, { message: 'Expected a JSON AG-UI run.' });
        return;
      }
      await handleRun(input, res);
      return;
    }
    sendJson(res, 404, { message: 'Not found.' });
  });
}

export function startAgent(port = Number(process.env.PORT || 4318), host = process.env.HOST || '127.0.0.1') {
  const server = createAgentServer();
  return new Promise((resolve) => {
    server.listen(port, host, () => resolve(server));
  });
}

async function handleRun(input, res) {
  const threadId = String(input?.threadId || 'thread');
  const runId = String(input?.runId || crypto.randomUUID());
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const send = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  try {
    send({ type: 'RUN_STARTED', threadId, runId });
    const decision = await decide(input);
    if (decision.tool) {
      const toolCallId = crypto.randomUUID();
      const parentMessageId = crypto.randomUUID();
      send({ type: 'TOOL_CALL_START', toolCallId, toolCallName: TOOL_NAME, parentMessageId });
      send({ type: 'TOOL_CALL_ARGS', toolCallId, delta: JSON.stringify(decision.tool) });
      send({ type: 'TOOL_CALL_END', toolCallId });
    }
    if (decision.text) {
      const messageId = crypto.randomUUID();
      send({ type: 'TEXT_MESSAGE_START', messageId, role: 'assistant' });
      send({ type: 'TEXT_MESSAGE_CONTENT', messageId, delta: decision.text });
      send({ type: 'TEXT_MESSAGE_END', messageId });
    }
    send({ type: 'RUN_FINISHED', threadId, runId, outcome: { type: 'success' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The search assistant failed.';
    send({ type: 'RUN_ERROR', message: redact(message) });
  } finally {
    res.end();
  }
}

async function decide(input) {
  const messages = Array.isArray(input?.messages) ? input.messages : [];
  const catalog = catalogFromContext(input?.context);
  const last = [...messages].reverse().find((message) => message?.role === 'user' || message?.role === 'tool');
  if (last?.role === 'tool') {
    const fallback = summarizeToolResult(contentText(last));
    const gemini = await tryGemini(messages, catalog, false, { omitFunctionCalls: true });
    if (gemini?.mode === 'gemini' && gemini.text?.trim()) return { text: gemini.text.trim() };
    return { text: fallback };
  }

  const question = contentText([...messages].reverse().find((message) => message?.role === 'user'));
  const local = interpretQuestion(question, catalog);
  if (local.chatOnly) {
    const gemini = await tryGemini(messages, catalog, false, {
      omitFunctionCalls: true,
      system: chatSystem(),
    });
    if (gemini?.mode === 'gemini' && gemini.text?.trim()) return { text: gemini.text.trim() };
    return { text: local.text };
  }
  const gemini = await tryGemini(messages, catalog, true);
  if (gemini?.tool) return { tool: sanitizeCriteria(gemini.tool, catalog) };
  return { tool: sanitizeCriteria(local, catalog) };
}

async function tryGemini(messages, catalog, allowTools, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  try {
    const result = await completeWithGemini({
      apiKey,
      model: process.env.GEMINI_MODEL?.trim() || 'gemma-4-26b-a4b-it',
      system: options.system || systemPrompt(catalog),
      contents: toGeminiContents(messages, { omitFunctionCalls: options.omitFunctionCalls === true }),
      allowTools,
    });
    return { ...result, mode: 'gemini' };
  } catch (error) {
    console.error(`Gemini request failed: ${redact(error instanceof Error ? error.message : String(error))}`);
    return { mode: 'gemini-error' };
  }
}

function chatSystem() {
  return [
    'You are the CoreExtract customer search assistant.',
    'The user is greeting you or asking what this chat can do.',
    'Answer in one or two sentences.',
    'They can ask for customers in plain language, and you update the customer grid with the same filters as a saved search.',
    'Do not invent customer rows, counts, or filters, and do not claim the grid changed.',
  ].join(' ');
}

function redact(text) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return apiKey ? text.split(apiKey).join('[redacted]') : text;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error('Request body is too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function loadEnv(url) {
  let text = '';
  try {
    text = readFileSync(url, 'utf8');
  } catch {
    return;
  }
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === '') process.env[key] = value;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 4318);
  const host = process.env.HOST || '127.0.0.1';
  await startAgent(port, host);
  console.log(`CoreExtract AG-UI agent listening on http://${host}:${port}/ag-ui/customer-search`);
}
