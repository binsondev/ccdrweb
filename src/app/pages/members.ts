import { Component, effect, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { AuthStore } from '../core/auth.store';
import { MembersStore } from '../core/members.store';
import { AppRole, MEMBER_ROLES } from '../core/models';
import { initials, roleLabel } from '../core/format';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-members',
  imports: [FormField, HlmBadge, HlmButton, HlmInput, StatusBanner, ...HlmCardImports],
  template: `
    <div class="grid gap-6">
      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      @if (store.loading()) {
        <p class="text-muted-foreground text-sm">Loading members…</p>
      } @else if (!store.members().length) {
        <p class="text-muted-foreground text-sm">No memberships in this tenant yet.</p>
      } @else {
        <ul class="grid gap-3">
          @for (member of store.members(); track member.id) {
            <li hlmCard size="sm">
              <div hlmCardContent class="flex flex-wrap items-center gap-3 py-4">
                <span
                  class="bg-primary text-primary-foreground grid size-9 place-items-center rounded-md text-xs font-semibold"
                  aria-hidden="true"
                >
                  {{ initials(member.name, member.email) }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="font-medium">{{ member.name || member.email }}</p>
                  <p class="text-muted-foreground truncate text-sm">{{ member.email }}</p>
                </div>
                <select
                  hlmInput
                  class="w-40"
                  [value]="member.role"
                  (change)="onRole(member.id, $event, member.exportGranted)"
                >
                  @for (role of roles; track role) {
                    <option [value]="role">{{ roleLabel(role) }}</option>
                  }
                </select>
                @if (member.pendingLogin) {
                  <span hlmBadge variant="secondary">Pending login</span>
                } @else {
                  <span hlmBadge>Linked</span>
                }
                <button hlmBtn variant="ghost" size="sm" type="button" (click)="store.remove(member.id)">
                  Remove
                </button>
              </div>
            </li>
          }
        </ul>
      }

      <section hlmCard class="max-w-3xl">
        <div hlmCardHeader>
          <h2 hlmCardTitle>Invite</h2>
          <p hlmCardDescription>The membership links when they sign in with this email.</p>
        </div>
        <div hlmCardContent>
          <form class="grid gap-3 md:grid-cols-[1fr_10rem_auto]" (submit)="onInvite($event)">
            <input hlmInput type="email" placeholder="name@hospital.org" [formField]="inviteForm.email" />
            <select hlmInput [formField]="inviteForm.role">
              @for (role of roles; track role) {
                <option [value]="role">{{ roleLabel(role) }}</option>
              }
            </select>
            <button hlmBtn type="submit" [disabled]="store.saving()">
              {{ store.saving() ? 'Inviting…' : 'Invite member' }}
            </button>
          </form>
        </div>
      </section>
    </div>
  `,
})
export class MembersPage {
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(MembersStore);
  protected readonly roles = MEMBER_ROLES;
  protected readonly roleLabel = roleLabel;
  protected readonly initials = initials;
  protected readonly model = signal({ email: '', role: 'QueryUser' as AppRole });
  protected readonly inviteForm = form(this.model, (schema) => {
    required(schema.email);
  });

  constructor() {
    effect(() => {
      if (this.auth.tenantSlug()) {
        void this.store.load();
      }
    });
  }

  protected onRole(id: string, event: Event, exportGranted: boolean) {
    const role = (event.target as HTMLSelectElement).value as AppRole;
    void this.store.changeRole(id, role, exportGranted);
  }

  protected onInvite(event: Event) {
    event.preventDefault();
    const value = this.model();
    void this.store.invite(value.email.trim(), value.role, false).then(() =>
      this.model.set({ email: '', role: 'QueryUser' }),
    );
  }
}
