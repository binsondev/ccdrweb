import { Component } from '@angular/core';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { protoMembers } from './mock';

@Component({
  selector: 'ccdr-proto-members',
  imports: [HlmBadge, ...HlmCardImports],
  template: `
    <ul class="grid gap-3">
      @for (member of members; track member.email) {
        <li hlmCard size="sm">
          <div hlmCardContent class="flex flex-wrap items-center gap-3 py-4">
            <span
              class="bg-primary text-primary-foreground grid size-9 place-items-center rounded-md text-xs font-semibold"
              aria-hidden="true"
            >
              {{ initials(member.email, member.name) }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-medium">{{ member.name || member.email }}</p>
              <p class="text-muted-foreground truncate text-sm">{{ member.email }}</p>
            </div>
            <span hlmBadge variant="outline">{{ member.role }}</span>
            @if (member.pending) {
              <span hlmBadge variant="secondary">Pending login</span>
            } @else {
              <span hlmBadge>Linked</span>
            }
          </div>
        </li>
      }
    </ul>
  `,
})
export class PrototypeMembers {
  protected readonly members = protoMembers;

  protected initials(email: string, name: string) {
    if (name) {
      return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  }
}
