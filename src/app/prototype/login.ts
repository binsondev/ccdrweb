import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { PrototypeThemeStore } from './theme';

@Component({
  selector: 'ccdr-proto-login',
  imports: [RouterLink, HlmBadge, HlmButton, HlmSeparator],
  template: `
    <div class="ccdr-proto bg-background text-foreground min-h-dvh" [class.dark]="theme.dark()">
      <div
        class="bg-primary text-primary-foreground flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[11px] font-medium"
      >
        <span>Enterprise prototype · mock walkthrough</span>
        <button hlmBtn variant="ghost" size="xs" class="text-primary-foreground h-6" type="button" (click)="theme.toggle()">
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
              Query users search only their tenant. Tokens are issued against a known email — no
              password form.
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
              Prototype sign-in
            </p>
            <h2 class="mt-1 text-2xl font-semibold tracking-tight">Enter a workspace</h2>
            <p class="text-muted-foreground mt-2 mb-6 text-sm leading-relaxed">
              Mock session only. The live app still calls
              <code class="bg-muted rounded px-1.5 py-0.5 text-xs">POST /api/dev/token</code>.
            </p>

            <div class="grid gap-2">
              <a hlmBtn variant="outline" routerLink="/prototype/customers" class="h-auto justify-start py-3 text-left">
                <span class="grid">
                  <span>Acme admin</span>
                  <span class="text-muted-foreground font-normal">Hospital registry · catalog and members</span>
                </span>
              </a>
              <a hlmBtn variant="outline" routerLink="/prototype/intake" class="h-auto justify-start py-3 text-left">
                <span class="grid">
                  <span>Acme uploader</span>
                  <span class="text-muted-foreground font-normal">Map workbooks and commit staged rows</span>
                </span>
              </a>
              <a hlmBtn variant="outline" routerLink="/prototype/search" class="h-auto justify-start py-3 text-left">
                <span class="grid">
                  <span>Acme query</span>
                  <span class="text-muted-foreground font-normal">Faceted search from filterable attributes</span>
                </span>
              </a>
              <a hlmBtn variant="secondary" routerLink="/prototype/tenants" class="h-auto justify-start py-3 text-left">
                <span class="grid">
                  <span>Platform</span>
                  <span class="text-muted-foreground font-normal">Create tenants and first admins</span>
                </span>
              </a>
            </div>

            <hlm-separator class="my-6" />
            <p class="text-muted-foreground text-center text-xs">
              Or open the
              <a routerLink="/login" class="text-foreground font-medium underline underline-offset-4">live API login</a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class PrototypeLogin {
  protected readonly theme = inject(PrototypeThemeStore);
}
