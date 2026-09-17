import { Component, input } from '@angular/core';

@Component({
  selector: 'ccdr-brand-mark',
  template: `
    @if (variant() === 'lockup') {
      <div class="inline-flex rounded-md bg-white p-2 shadow-sm">
        <img
          src="/coreextract-logo.jpg"
          alt="CoreExtract"
          class="h-20 w-auto max-w-[20rem] object-contain object-center sm:h-24"
        />
      </div>
    } @else {
      <span class="flex h-12 w-full max-w-[16rem] items-center justify-center overflow-hidden rounded-md bg-white">
        <img
          src="/coreextract-logo.jpg"
          alt="CoreExtract"
          class="h-[5.5rem] w-auto max-w-none object-contain object-center"
        />
      </span>
    }
  `,
})
export class BrandMark {
  readonly variant = input<'wordmark' | 'lockup'>('wordmark');
}
