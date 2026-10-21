import type { FrontendToolConfig } from '@copilotkit/angular';

/**
 * Pass-through used so TypeScript infers handler arguments from the tool schema.
 * Same shape as the Angular Architects AG-UI helper.
 */
export function createFrontendTool<Args extends Record<string, unknown>>(
  tool: FrontendToolConfig<Args>,
): FrontendToolConfig<Args> {
  if (tool.followUp === false && !tool.description.includes('Do not request another tool')) {
    return {
      ...tool,
      description: `${tool.description} This call ends the turn. Do not request another tool after it.`,
    };
  }
  return tool;
}
