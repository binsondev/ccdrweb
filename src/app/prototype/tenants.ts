import { Component } from '@angular/core';

@Component({
  selector: 'ccdr-proto-tenants',
  template: `
    <div class="grid gap-4 md:grid-cols-3">
      @for (tenant of tenants; track tenant.slug) {
        <article class="proto-panel">
          <p class="proto-kicker">{{ tenant.type }}</p>
          <h2 class="font-serif text-2xl">{{ tenant.name }}</h2>
          <p class="font-mono text-xs text-[color:var(--proto-muted)]">{{ tenant.slug }}</p>
          <p class="mt-4 text-[13px] text-[color:var(--proto-muted)]">{{ tenant.note }}</p>
        </article>
      }
    </div>
  `,
})
export class PrototypeTenants {
  protected readonly tenants = [
    { slug: 'acme', name: 'Acme Health', type: 'Hospital', note: 'Match key MRN. Cardiology intake live.' },
    { slug: 'globex', name: 'Globex Retail', type: 'Shop', note: 'Loyalty id + phone. Empty catalog until mapped.' },
    { slug: 'riverside', name: 'Riverside School', type: 'School', note: 'Student id. First admin assigned.' },
  ];
}
