import { Component } from '@angular/core';
import { protoMembers } from './mock';

@Component({
  selector: 'ccdr-proto-members',
  template: `
    <ul class="grid gap-3">
      @for (member of members; track member.email) {
        <li class="proto-person">
          <span class="proto-avatar" aria-hidden="true">{{ initials(member.email, member.name) }}</span>
          <div class="min-w-0 flex-1">
            <p class="font-medium">{{ member.name || member.email }}</p>
            <p class="truncate text-[13px] text-[color:var(--proto-muted)]">{{ member.email }}</p>
          </div>
          <span class="proto-flag">{{ member.role }}</span>
          @if (member.pending) {
            <span class="proto-flag proto-flag-key">Pending login</span>
          }
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
