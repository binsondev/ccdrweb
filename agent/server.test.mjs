import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { HttpAgent } from '@ag-ui/client';
import { createAgentServer } from './server.mjs';

const catalog = {
  recordTypes: [{ code: 'patient', label: 'Patient' }],
  attributes: [
    {
      recordType: 'patient',
      code: 'age',
      label: 'Age',
      dataType: 'Integer',
      operators: ['eq', 'gte', 'lte'],
      options: [],
    },
    {
      recordType: 'patient',
      code: 'ward',
      label: 'Ward',
      dataType: 'Dropdown',
      operators: ['eq'],
      options: [{ value: 'ICU', label: 'ICU' }],
    },
  ],
  current: { recordType: '', q: '', filter: [] },
};

test('AG-UI run asks the client to apply customer search filters', async (t) => {
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  t.after(() => {
    if (previous == null) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  });

  const server = createAgentServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const port = server.address().port;

  const agent = new HttpAgent({
    url: `http://127.0.0.1:${port}/ag-ui/customer-search`,
    agentId: 'customerSearchAgent',
  });
  agent.addMessage({ id: 'user-1', role: 'user', content: 'Seniors in ICU' });
  const result = await agent.runAgent({
    tools: [{
      name: 'applyCustomerSearch',
      description: 'Apply the customer search',
      parameters: { type: 'object' },
    }],
    context: [{ description: 'catalog', value: JSON.stringify(catalog) }],
  });

  const assistant = result.newMessages.find((message) => message.role === 'assistant');
  assert.ok(assistant);
  const call = assistant.toolCalls?.[0];
  assert.equal(call?.function.name, 'applyCustomerSearch');
  const args = JSON.parse(call.function.arguments);
  assert.equal(args.recordType, 'patient');
  assert.ok(args.filter.includes('age:gte:60'));
  assert.ok(args.filter.includes('ward:eq:ICU'));
});

test('a tool result is answered with text and no second search', async (t) => {
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  t.after(() => {
    if (previous == null) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  });

  const server = createAgentServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const port = server.address().port;
  const agent = new HttpAgent({
    url: `http://127.0.0.1:${port}/ag-ui/customer-search`,
    agentId: 'customerSearchAgent',
  });
  agent.addMessage({
    id: 'tool-1',
    role: 'tool',
    toolCallId: 'call-1',
    content: JSON.stringify({ ok: true, count: 2, recordType: 'patient', q: '', filter: ['age:gte:60'] }),
  });
  const result = await agent.runAgent({});
  const assistant = result.newMessages.find((message) => message.role === 'assistant');
  assert.equal(assistant?.toolCalls, undefined);
  assert.match(String(assistant?.content), /2 records/);
  assert.match(String(assistant?.content), /GEMINI_API_KEY/);
});
