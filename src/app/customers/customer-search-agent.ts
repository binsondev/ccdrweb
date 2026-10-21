import { inject, Injector, runInInjectionContext } from '@angular/core';
import { connectAgentContext, injectAgentStore } from '@copilotkit/angular';
import { z } from 'zod';
import { initAgentStore } from '../core/ag-ui/init-agent-store';
import { createFrontendTool } from '../core/ag-ui/tool-definition';
import { CustomersStore } from '../core/customers.store';
import type { DataType } from '../core/models';
import { SearchApplied, type CustomerSearchArgs } from './search-applied';

export const CUSTOMER_SEARCH_AGENT_ID = 'customerSearchAgent';

const searchArgs = z.object({
  recordType: z.string().describe('Record type code from the catalog, or an empty string for all types.'),
  q: z.string().describe('Free-text query passed as q to GET /api/customers, or an empty string.'),
  filter: z.array(z.string()).describe('Filters as code:op:value. op is eq, contains, gt, gte, lt, or lte.'),
});

export function injectCustomerSearchAgentStore() {
  const store = inject(CustomersStore);
  const tool = createApplyCustomerSearchTool();
  initAgentStore({
    agentId: CUSTOMER_SEARCH_AGENT_ID,
    url: '/ag-ui/customer-search',
    useServerMemory: false,
    frontendTools: [tool],
  });
  connectAgentContext(() => ({
    description:
      'CoreExtract customer catalog and the current search. Map the question onto recordType, q, and filter code:op:value. Use only these fields. The tool replaces the current search.',
    value: JSON.stringify(catalogValue(store)),
  }));
  return injectAgentStore(CUSTOMER_SEARCH_AGENT_ID);
}

function createApplyCustomerSearchTool() {
  const injector = inject(Injector);
  return createFrontendTool({
    name: 'applyCustomerSearch',
    description: `Replace the customer search and refresh the existing customer grid.
Uses the same query as a saved search: recordType, q, and repeated filter values shaped as code:op:value.
Call this for every request to find, show, filter, narrow, or clear customers.
Do not invent customer rows. The screen loads them with GET /api/customers.`,
    parameters: searchArgs,
    component: SearchApplied,
    handler: async (args: CustomerSearchArgs) => {
      const customers = runInInjectionContext(injector, () => inject(CustomersStore));
      return customers.applyAgentSearch({
        recordType: args.recordType ?? '',
        q: args.q ?? '',
        filter: args.filter ?? [],
      });
    },
  });
}

function catalogValue(store: InstanceType<typeof CustomersStore>) {
  const criteria = store.searchCriteria();
  return {
    recordTypes: store.recordTypes().filter((type) => type.active).map((type) => ({
      code: type.code,
      label: type.label,
    })),
    attributes: store.attributes().filter((attr) => attr.active && attr.filterable).map((attr) => ({
      recordType: attr.recordType,
      code: attr.code,
      label: attr.label,
      dataType: attr.dataType,
      operators: operatorsFor(attr.dataType),
      options: attr.options.map((option) => ({ value: option.value, label: option.label })),
    })),
    current: {
      recordType: criteria.recordType,
      q: criteria.q,
      filter: criteria.filter,
    },
  };
}

function operatorsFor(dataType: DataType) {
  switch (dataType) {
    case 'Text':
    case 'Multiline':
    case 'Phone':
    case 'Email':
      return ['contains', 'eq'];
    case 'Integer':
    case 'Decimal':
    case 'Date':
    case 'DateTime':
      return ['eq', 'gt', 'gte', 'lt', 'lte'];
    case 'Boolean':
    case 'Dropdown':
      return ['eq'];
    default:
      return ['eq'];
  }
}
