import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ccdr-proto-login',
  imports: [RouterLink],
  template: `
    <div class="ccdr-proto grid min-h-dvh lg:grid-cols-[1.1fr_0.9fr]">
      <section class="proto-hero">
        <p class="proto-kicker text-white/50">Central Customer Data Repository</p>
        <h1 class="font-serif text-4xl leading-[1.1] text-white md:text-5xl">
          The catalog is the customer.
        </h1>
        <p class="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
          Each tenant defines its own attributes. Excel mappings bind headers to those codes.
          Uploads stage, then commit. Nothing is inferred from column order.
        </p>
        <ol class="proto-steps">
          <li><span>01</span> Shape the catalog</li>
          <li><span>02</span> Bind the workbook</li>
          <li><span>03</span> Stage, then commit</li>
        </ol>
      </section>

      <section class="flex flex-col justify-center bg-[color:var(--proto-paper)] px-6 py-10 md:px-12">
        <p class="proto-kicker">Prototype sign-in</p>
        <h2 class="font-serif text-3xl tracking-tight">Enter a workspace</h2>
        <p class="mt-2 mb-8 text-sm text-[color:var(--proto-muted)]">
          Mock walkthrough — no token is issued. The live API login stays at
          <a class="underline decoration-[color:var(--proto-sage)] underline-offset-4" routerLink="/login">/login</a>.
        </p>

        <div class="grid gap-3">
          <a routerLink="/prototype/customers" class="proto-persona">
            <span class="proto-persona-role">Acme admin</span>
            <span class="proto-persona-meta">Hospital registry · full catalog and members</span>
          </a>
          <a routerLink="/prototype/intake" class="proto-persona">
            <span class="proto-persona-role">Acme uploader</span>
            <span class="proto-persona-meta">Map workbooks and commit staged rows</span>
          </a>
          <a routerLink="/prototype/search" class="proto-persona">
            <span class="proto-persona-role">Acme query</span>
            <span class="proto-persona-meta">Faceted search from filterable attributes</span>
          </a>
          <a routerLink="/prototype/tenants" class="proto-persona proto-persona-platform">
            <span class="proto-persona-role">Platform</span>
            <span class="proto-persona-meta">Create tenants and first admins</span>
          </a>
        </div>
      </section>
    </div>
  `,
})
export class PrototypeLogin {}
