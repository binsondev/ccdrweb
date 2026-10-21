import {
  HttpAgent,
  randomUUID,
  type HttpAgentConfig,
  type RunAgentInput,
} from '@ag-ui/client';
import { inject } from '@angular/core';
import { CopilotKit, registerFrontendTool, type FrontendToolConfig } from '@copilotkit/angular';

export type InitAgentStoreConfig<Args extends Record<string, unknown> = Record<string, unknown>> = {
  agentId: string;
  url: string;
  useServerMemory: boolean;
  frontendTools?: FrontendToolConfig<Args>[];
};

/**
 * Registers an AG-UI HttpAgent after startup so a lazy screen can bring its own tools.
 * CopilotKit otherwise expects agents at provideCopilotKit time.
 */
export function initAgentStore<Args extends Record<string, unknown>>(config: InitAgentStoreConfig<Args>): void {
  const copilotKit = inject(CopilotKit);
  if (!copilotKit.getAgent(config.agentId)) {
    const httpAgent = new AppHttpAgent(
      {
        agentId: config.agentId,
        url: absoluteUrl(config.url),
        threadId: randomUUID(),
      },
      { useServerMemory: config.useServerMemory },
    );
    copilotKit.updateRuntime({
      selfManagedAgents: {
        ...copilotKit.agents(),
        [config.agentId]: httpAgent,
      },
    });
  }

  for (const tool of config.frontendTools ?? []) {
    registerFrontendTool({
      ...tool,
      agentId: config.agentId,
    });
  }
}

class AppHttpAgent extends HttpAgent {
  constructor(
    config: HttpAgentConfig,
    private readonly options: { useServerMemory: boolean },
  ) {
    super(config);
  }

  protected override requestInit(input: RunAgentInput): RequestInit {
    if (!this.options.useServerMemory) return super.requestInit(input);
    const latest = input.messages.at(-1);
    return super.requestInit({
      ...input,
      messages: latest ? [latest] : [],
    });
  }
}

function absoluteUrl(url: string) {
  if (typeof document === 'undefined') return url;
  return new URL(url, document.baseURI).href;
}
