import { Component, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormField, form, required } from '@angular/forms/signals';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { AuthStore } from '../core/auth.store';
import { ThemeStore } from '../core/theme.store';
import { BrandMark } from '../shared/brand-mark';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-login',
  imports: [FormField, HlmButton, HlmInput, BrandMark, StatusBanner],
  template: `
    <div class="bg-background text-foreground min-h-dvh">
      <div
        class="bg-primary text-primary-foreground flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[11px] font-medium"
      >
        <span>Data Extraction Solution</span>
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
            <ccdr-brand-mark variant="lockup" />
            <h1 class="mt-8 max-w-lg text-4xl font-semibold tracking-tight">
              Enterprise customer master for multi-tenant operations.
            </h1>
            <p class="text-sidebar-foreground/70 mt-4 max-w-md text-sm leading-relaxed">
              Sign in with your email and password. The API issues an access token and a refresh token.
              Tenant Admin owns the attribute schema. Uploaders map Excel columns and commit batches.
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
            <div class="mb-8 lg:hidden">
              <ccdr-brand-mark variant="lockup" />
            </div>
            <p class="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">
              Sign in
            </p>
            <h2 class="mt-1 text-2xl font-semibold tracking-tight">Email and password</h2>
            <p class="text-muted-foreground mt-2 mb-6 text-sm leading-relaxed">
              Use your CoreExtract workspace email and password.
            </p>

            <ccdr-status [error]="auth.error()" />

            <form class="grid gap-3" (submit)="onSubmit($event)">
              <label class="grid gap-1.5 text-sm font-medium" for="username">
                Email
                <input
                  id="username"
                  hlmInput
                  type="email"
                  autocomplete="username"
                  [formField]="loginForm.username"
                />
              </label>
              <label class="grid gap-1.5 text-sm font-medium" for="password">
                Password
                <input
                  id="password"
                  hlmInput
                  type="password"
                  autocomplete="current-password"
                  [formField]="loginForm.password"
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
  protected readonly model = signal({ username: '', password: '' });
  protected readonly loginForm = form(this.model, (schema) => {
    required(schema.username);
    required(schema.password);
  });

  constructor() {
    inject(Title).setTitle('Sign in · CoreExtract');
  }

  protected onSubmit(event: Event) {
    event.preventDefault();
    const value = this.model();
    void this.auth.login(value.username.trim(), value.password);
  }
}
