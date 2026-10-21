import { randomUUID } from '@ag-ui/client';
import type { Signal } from '@angular/core';
import type { AgentStore, CopilotKit } from '@copilotkit/angular';

export async function sendMessage(
  copilotKit: CopilotKit,
  store: Signal<AgentStore>,
  content: string,
): Promise<void> {
  const agent = store().agent;
  agent.addMessage({ id: randomUUID(), role: 'user', content });
  await copilotKit.core.runAgent({ agent });
}
