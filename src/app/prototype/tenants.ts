import { Component } from '@angular/core';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'ccdr-proto-tenants',
  imports: [HlmBadge, ...HlmCardImports],
  template: `
    <div class="grid gap-4 md:grid-cols-3">
      @for (tenant of tenants; track tenant.slug) {
        <article hlmCard>
          <div hlmCardHeader>
            <span hlmBadge variant="outline">{{ tenant.type }}</span>
            <h2 hlmCardTitle>{{ tenant.name }}</h2>
            <p hlmCardDescription class="font-mono">{{ tenant.slug }}</p>
          </div>
          <div hlmCardContent>
            <p class="text-muted-foreground text-sm">{{ tenant.note }}</p>
          </div>
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
