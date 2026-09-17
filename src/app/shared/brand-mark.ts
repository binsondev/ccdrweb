import { Component, input } from '@angular/core';

@Component({
  selector: 'ccdr-brand-mark',
  template: `
    @if (variant() === 'lockup') {
      <div class="inline-flex rounded-md bg-white p-3 shadow-sm">
        <img
          src="/coreextract-logo.jpg"
          alt="CoreExtract"
          class="h-16 w-auto max-w-[18rem] object-contain sm:h-[4.5rem]"
        />
      </div>
    } @else {
      <span class="flex min-w-0 items-center gap-2.5">
        <span class="flex size-8 shrink-0 overflow-hidden rounded-md" aria-hidden="true">
          <span class="bg-[var(--brand-core)] h-full w-1/2"></span>
          <span class="bg-[var(--brand-extract)] h-full w-1/2"></span>
        </span>
        <span class="min-w-0">
          <span class="block text-sm leading-tight font-semibold tracking-tight">
            <span class="text-[var(--brand-core)]">Core</span><span class="text-[var(--brand-extract)]">Extract</span>
          </span>
          <span class="text-[var(--brand-ink)] mt-0.5 block text-[10px] tracking-[0.06em]">
            Data Extraction Solution
          </span>
        </span>
      </span>
    }
  `,
})
export class BrandMark {
  readonly variant = input<'wordmark' | 'lockup'>('wordmark');
}
