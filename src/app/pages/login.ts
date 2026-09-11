import { Component, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { AuthStore } from '../core/auth.store';
import { DEV_USERS } from '../core/models';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-login',
  imports: [FormField, HlmButton, HlmInput, StatusBanner, ...HlmCardImports, ...HlmFieldImports],
  template: `
    <main class="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
      <section hlmCard>
        <div hlmCardHeader>
          <h1 hlmCardTitle>Sign in to CCDR</h1>
          <p hlmCardDescription>
            Local development issues a JWT from the API. Production will use your identity provider
            instead of this screen.
          </p>
        </div>
        <div hlmCardContent class="grid gap-6">
          <ccdr-status [error]="auth.error()" />
          <form class="grid gap-4" (submit)="onSubmit($event)">
            <div hlmField>
              <label hlmFieldLabel for="email">Email</label>
              <input
                id="email"
                hlmInput
                type="email"
                autocomplete="username"
                [formField]="loginForm.email"
              />
            </div>
            <button hlmBtn type="submit" [disabled]="auth.loading()">
              {{ auth.loading() ? 'Signing in…' : 'Issue development token' }}
            </button>
          </form>
          <div>
            <p class="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Seeded users
            </p>
            <div class="grid gap-2">
              @for (user of users; track user.email) {
                <button
                  hlmBtn
                  variant="outline"
                  type="button"
                  class="h-auto justify-start py-2 text-left"
                  (click)="pick(user.email)"
                >
                  <span class="grid">
                    <span>{{ user.label }}</span>
                    <span class="text-muted-foreground font-normal">{{ user.email }} · {{ user.hint }}</span>
                  </span>
                </button>
              }
            </div>
          </div>
        </div>
      </section>
    </main>
  `,
})
export class LoginPage {
  protected readonly auth = inject(AuthStore);
  protected readonly users = DEV_USERS;
  protected readonly model = signal({ email: 'acme.admin@local' });
  protected readonly loginForm = form(this.model, (schema) => {
    required(schema.email);
  });

  protected pick(email: string) {
    this.model.update((current) => ({ ...current, email }));
    void this.auth.login(email);
  }

  protected onSubmit(event: Event) {
    event.preventDefault();
    void this.auth.login(this.model().email);
  }
}
