import { Component, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { AuthStore } from '../core/auth.store';
import { ThemeStore } from '../core/theme.store';
import { DEV_USERS } from '../core/models';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-login',
  imports: [FormField, HlmBadge, HlmButton, HlmInput, HlmSeparator, StatusBanner],
  template: `
    <div class="bg-background text-foreground min-h-dvh">
      <div
        class="bg-primary text-primary-foreground flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[11px] font-medium"
      >
        <span>Central Customer Data Repository</span>
        <button
          hlmBtn
          variant="ghost"
          size="xs"
          class="text-primary-foreground h-6"
          type="button"
          (click)="theme.toggle()"
        >
          {{ theme.label() }} theme
        </button>
      </div>

      <div class="grid min-h-[calc(100dvh-2rem)] lg:grid-cols-2">
        <section class="bg-sidebar text-sidebar-foreground hidden flex-col justify-between px-10 py-12 lg:flex">
          <div>
            <span hlmBadge variant="outline" class="border-sidebar-border text-sidebar-foreground">
              CCDR
            </span>
            <h1 class="mt-6 max-w-lg text-4xl font-semibold tracking-tight">
              Enterprise customer master for multi-tenant operations.
            </h1>
            <p class="text-sidebar-foreground/70 mt-4 max-w-md text-sm leading-relaxed">
              Tenant Admin owns the attribute schema. Uploaders map Excel columns and commit batches.
              Query users search only their tenant. Sign in with a known email — no password form.
            </p>
          </div>
          <ol class="grid gap-3 text-sm">
            <li class="flex gap-3">
              <span class="text-sidebar-foreground/40 w-6 font-mono text-xs">01</span>
              Shape the catalog
            </li>
            <li class="flex gap-3">
              <span class="text-sidebar-foreground/40 w-6 font-mono text-xs">02</span>
              Bind the workbook
            </li>
            <li class="flex gap-3">
              <span class="text-sidebar-foreground/40 w-6 font-mono text-xs">03</span>
              Stage, then commit
            </li>
          </ol>
        </section>

        <section class="flex items-center px-6 py-10 sm:px-12">
          <div class="mx-auto w-full max-w-md">
            <p class="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">
              Sign in
            </p>
            <h2 class="mt-1 text-2xl font-semibold tracking-tight">Choose a persona</h2>
            <p class="text-muted-foreground mt-2 mb-6 text-sm leading-relaxed">
              Pick a seeded user to enter a workspace. There is no password on this screen.
            </p>

            <ccdr-status [error]="auth.error()" />

            <div class="grid gap-2">
              @for (user of users; track user.email) {
                <button
                  hlmBtn
                  variant="outline"
                  type="button"
                  class="h-auto justify-start py-3 text-left"
                  [disabled]="auth.loading()"
                  (click)="pick(user.email)"
                >
                  <span class="grid">
                    <span>{{ user.label }}</span>
                    <span class="text-muted-foreground font-normal">{{ user.email }} · {{ user.hint }}</span>
                  </span>
                </button>
              }
            </div>

            <hlm-separator class="my-6" />

            <form class="grid gap-3" (submit)="onSubmit($event)">
              <label class="grid gap-1.5 text-sm font-medium" for="email">
                Email
                <input
                  id="email"
                  hlmInput
                  type="email"
                  autocomplete="username"
                  [formField]="loginForm.email"
                />
              </label>
              <button hlmBtn type="submit" [disabled]="auth.loading()">
                {{ auth.loading() ? 'Signing in…' : 'Sign in' }}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class LoginPage {
  protected readonly auth = inject(AuthStore);
  protected readonly theme = inject(ThemeStore);
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
