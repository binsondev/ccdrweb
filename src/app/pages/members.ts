import { Component, effect, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { AuthStore } from '../core/auth.store';
import { MembersStore } from '../core/members.store';
import { AppRole, MEMBER_ROLES } from '../core/models';
import { roleLabel } from '../core/format';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-members',
  imports: [FormField, HlmBadge, HlmButton, HlmInput, StatusBanner, ...HlmCardImports, ...HlmTableImports],
  template: `
    <div class="grid gap-6">
      <header class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Members</h1>
        <p class="text-muted-foreground text-sm">
          Invite by email. The membership links when they sign in with your identity provider (or a
          local development token).
        </p>
      </header>

      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      <section hlmCard>
        <div hlmCardContent>
          @if (store.loading()) {
            <p class="text-muted-foreground text-sm">Loading members…</p>
          } @else if (!store.members().length) {
            <p class="text-muted-foreground text-sm">No memberships in this tenant yet.</p>
          } @else {
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>Email</th>
                    <th hlmTh>Role</th>
                    <th hlmTh>Status</th>
                    <th hlmTh></th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (member of store.members(); track member.id) {
                    <tr hlmTr>
                      <td hlmTd>{{ member.email }}</td>
                      <td hlmTd>
                        <select
                          hlmInput
                          [value]="member.role"
                          (change)="onRole(member.id, $event, member.exportGranted)"
                        >
                          @for (role of roles; track role) {
                            <option [value]="role">{{ roleLabel(role) }}</option>
                          }
                        </select>
                      </td>
                      <td hlmTd>
                        @if (member.pendingLogin) {
                          <span hlmBadge variant="outline">Pending first login</span>
                        } @else {
                          <span hlmBadge variant="secondary">Linked</span>
                        }
                      </td>
                      <td hlmTd>
                        <button hlmBtn variant="ghost" size="sm" type="button" (click)="store.remove(member.id)">
                          Remove
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </section>

      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>Invite</h2>
        </div>
        <div hlmCardContent>
          <form class="grid gap-3 md:grid-cols-3" (submit)="onInvite($event)">
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
