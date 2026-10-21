const TOOL_NAME = 'applyCustomerSearch';

const PARAMETERS = {
  type: 'object',
  properties: {
    recordType: {
      type: 'string',
      description: 'Catalog record type code, or an empty string for all types.',
    },
    q: {
      type: 'string',
      description: 'Free-text q for GET /api/customers, or an empty string.',
    },
    filter: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filters as code:op:value. op is eq, contains, gt, gte, lt, or lte.',
    },
  },
  required: ['recordType', 'q', 'filter'],
};

export async function completeWithGemini({ apiKey, model, system, contents, allowTools }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { temperature: 0.2 },
  };
  if (allowTools) {
    body.tools = [{
      functionDeclarations: [{
        name: TOOL_NAME,
        description: 'Replace the CoreExtract customer search. The app then calls GET /api/customers. Do not invent rows.',
        parameters: PARAMETERS,
      }],
    }];
    body.toolConfig = {
      functionCallingConfig: { mode: 'ANY', allowedFunctionNames: [TOOL_NAME] },
    };
  }

  let response = await postGemini(url, apiKey, body);
  if (response.status === 429 || response.status === 503) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    response = await postGemini(url, apiKey, body);
  }
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Gemini HTTP ${response.status}: ${redact(detail, apiKey)}`);
  }
  const payload = await response.json();
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  let text = '';
  let tool = null;
  for (const part of parts) {
    if (typeof part?.text === 'string') text += part.text;
    const call = part?.functionCall;
    if (call?.name === TOOL_NAME && call.args && typeof call.args === 'object') {
      tool = {
        recordType: call.args.recordType == null ? '' : String(call.args.recordType),
        q: call.args.q == null ? '' : String(call.args.q),
        filter: asFilterList(call.args.filter),
      };
    }
  }
  return { text: text.trim(), tool };
}

export function toGeminiContents(messages, options = {}) {
  const omitFunctionCalls = options.omitFunctionCalls === true;
  const contents = [];
  for (const message of messages ?? []) {
    if (!message || message.role === 'system' || message.role === 'developer') continue;
    if (message.role === 'user') {
      const text = textOf(message);
      if (text) pushPart(contents, 'user', { text });
      continue;
    }
    if (message.role === 'assistant') {
      const text = textOf(message);
      if (text) pushPart(contents, 'model', { text });
      if (omitFunctionCalls) continue;
      for (const call of message.toolCalls ?? []) {
        let args = {};
        try {
          args = JSON.parse(call.function?.arguments || '{}');
        } catch {
          args = {};
        }
        pushPart(contents, 'model', {
          functionCall: { name: call.function?.name || TOOL_NAME, args },
        });
      }
      continue;
    }
    if (message.role === 'tool') {
      if (omitFunctionCalls) {
        const text = textOf(message);
        if (text) pushPart(contents, 'user', { text: `Search result: ${text}` });
        continue;
      }
      const name = toolName(messages, message.toolCallId);
      let response;
      try {
        response = JSON.parse(textOf(message) || '{}');
      } catch {
        response = { result: textOf(message) };
      }
      if (!response || typeof response !== 'object' || Array.isArray(response)) {
        response = { result: response };
      }
      pushPart(contents, 'user', { functionResponse: { name, response } });
    }
  }
  return contents;
}

export function systemPrompt(catalog) {
  return [
    'You are the CoreExtract customer search assistant.',
    'The user-facing product name is CoreExtract.',
    'You do not fetch or invent customer rows. The screen searches with the existing GET /api/customers.',
    'When the user wants to find, show, filter, narrow, or clear customers, call applyCustomerSearch once.',
    'That call replaces the current search. recordType is a catalog code or "". q is free text or "".',
    'Each filter is code:op:value using eq, contains, gt, gte, lt, or lte, and only codes from the catalog.',
    'Use contains for text, eq for dropdown and boolean, and gte or lte for ranges. Booleans are true or false.',
    'Dropdown values must be an option value from the catalog.',
    'Show everyone or clear filters with recordType "", q "", and filter [].',
    'If a tool result is already the latest turn, do not call a tool. Reply in one or two sentences and use the returned count.',
    'If ok is false, explain the error in plain language.',
    '',
    `Catalog: ${JSON.stringify(catalog)}`,
  ].join('\n');
}

function postGemini(url, apiKey, body) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
}

function asFilterList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function textOf(message) {
  const content = message?.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map((part) => (part && typeof part.text === 'string' ? part.text : '')).join('');
}

function toolName(messages, toolCallId) {
  for (const message of messages ?? []) {
    if (message?.role !== 'assistant') continue;
    const call = (message.toolCalls ?? []).find((item) => item.id === toolCallId);
    if (call?.function?.name) return call.function.name;
  }
  return TOOL_NAME;
}

function pushPart(contents, role, part) {
  const previous = contents[contents.length - 1];
  if (previous?.role === role) previous.parts.push(part);
  else contents.push({ role, parts: [part] });
}

function redact(text, apiKey) {
  return apiKey ? text.split(apiKey).join('[redacted]') : text;
}
