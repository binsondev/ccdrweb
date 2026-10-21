import { Component, inject, input } from '@angular/core';
import type { AngularToolCall, ToolRenderer } from '@copilotkit/angular';
import { CustomersStore } from '../core/customers.store';

export type CustomerSearchArgs = {
  recordType: string;
  q: string;
  filter: string[];
};

@Component({
  selector: 'ccdr-search-applied',
  template: `
    @let args = toolCall().args;
    <div class="border-border bg-muted/40 grid gap-1 rounded-md border px-3 py-2 text-sm">
      <p class="text-[11px] font-medium tracking-[0.14em] uppercase" style="color: var(--brand-core)">
        Customer grid
      </p>
      <p>
        {{ args.recordType ? typeLabel(args.recordType) : 'All types' }}
        @if (args.q) {
          · “{{ args.q }}”
        }
        @if (!args.filter?.length && !args.q && !args.recordType) {
          · every record
        }
      </p>
      @if (args.filter?.length) {
        <p class="text-muted-foreground text-xs">{{ args.filter?.join(' · ') }}</p>
      }
    </div>
  `,
})
export class SearchApplied implements ToolRenderer<CustomerSearchArgs> {
  readonly toolCall = input.required<AngularToolCall<CustomerSearchArgs>>();
  private readonly store = inject(CustomersStore);
  protected readonly typeLabel = (code: string) => this.store.typeLabel()(code);
}
