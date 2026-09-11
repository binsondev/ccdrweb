import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { protoNav } from './mock';

@Component({
  selector: 'ccdr-proto-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="ccdr-proto min-h-dvh md:grid md:grid-cols-[17.5rem_1fr]">
      <div class="proto-banner md:col-span-2">
        <span>UI prototype · mock Acme Health · not wired to the API</span>
        <a routerLink="/login">Open live app</a>
      </div>

      <header class="flex items-center justify-between border-b border-[color:var(--proto-rule)] px-4 py-3 md:hidden">
        <p class="font-serif text-lg">CCDR</p>
        <button type="button" class="proto-ghost-btn" (click)="menuOpen.set(!menuOpen())">
          {{ menuOpen() ? 'Close' : 'Menu' }}
        </button>
      </header>

      <aside class="proto-rail md:flex" [class.hidden]="!menuOpen()">
        <a routerLink="/prototype/customers" class="proto-brand" (click)="menuOpen.set(false)">
          <span class="proto-mark" aria-hidden="true">C</span>
          <span>
            <span class="block font-serif text-[1.35rem] leading-none tracking-tight">CCDR</span>
            <span class="text-[11px] tracking-[0.14em] text-white/45 uppercase">Registry</span>
          </span>
        </a>

        <div class="proto-tenant">
          <p class="text-[11px] tracking-[0.16em] text-white/40 uppercase">Workspace</p>
          <p class="mt-1 font-medium text-white">Acme Health</p>
          <p class="text-[12px] text-white/55">Hospital · acme</p>
        </div>

        <nav class="mt-6 grid gap-5" aria-label="Prototype">
          @for (group of nav; track group.label) {
            <div>
              <p class="mb-1 px-2 text-[10px] tracking-[0.18em] text-white/35 uppercase">{{ group.label }}</p>
              <div class="grid gap-0.5">
                @for (item of group.items; track item.path) {
                  <a
                    [routerLink]="item.path"
                    routerLinkActive="proto-nav-active"
                    class="proto-nav-item"
                    (click)="menuOpen.set(false)"
                  >
                    <span>{{ item.label }}</span>
                    <span class="text-[11px] text-white/40">{{ item.hint }}</span>
                  </a>
                }
              </div>
            </div>
          }
        </nav>

        <div class="mt-auto border-t border-white/10 pt-4">
          <p class="text-[13px] text-white/80">Maya Iyer</p>
          <p class="text-[11px] text-white/40">Tenant admin · acme.admin@local</p>
        </div>
      </aside>

      <main class="min-w-0 bg-[color:var(--proto-paper)]">
        <header class="proto-pagehead">
          <div>
            <p class="proto-kicker">{{ kicker() }}</p>
            <h1>{{ title() }}</h1>
          </div>
          <p class="max-w-md text-right text-[13px] text-[color:var(--proto-muted)] max-md:hidden">
            {{ blurb() }}
          </p>
        </header>
        <div class="px-4 pb-10 md:px-8">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class PrototypeShell {
  private readonly router = inject(Router);
  protected readonly nav = protoNav;
  protected readonly menuOpen = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly title = computed(() => this.meta().title);
  protected readonly kicker = computed(() => this.meta().kicker);
  protected readonly blurb = computed(() => this.meta().blurb);

  private meta() {
    const url = this.url();
    if (url.includes('search')) {
      return {
        kicker: 'Records',
        title: 'Faceted search',
        blurb: 'Dynamic filters from filterable attributes — same contract as the list API.',
      };
    }
    if (url.includes('attributes')) {
      return {
        kicker: 'Catalog',
        title: 'Attributes',
        blurb: 'The tenant has no Customer class. These fields are the record.',
      };
    }
    if (url.includes('intake')) {
      return {
        kicker: 'Intake',
        title: 'Excel intake',
        blurb: 'Map headers, stage the workbook, then commit. Column order is never guessed.',
      };
    }
    if (url.includes('members')) {
      return {
        kicker: 'Access',
        title: 'Members',
        blurb: 'Invite by email. The seat links on first sign-in.',
      };
    }
    if (url.includes('settings')) {
      return {
        kicker: 'Access',
        title: 'Tenant settings',
        blurb: 'Commit writes valid rows, or nothing if any row fails.',
      };
    }
    if (url.includes('tenants')) {
      return {
        kicker: 'Platform',
        title: 'Tenants',
        blurb: 'Platform admins create workspaces. They do not see customer rows.',
      };
    }
    return {
      kicker: 'Records',
      title: 'Customers',
      blurb: 'Search any value, or filter on attributes marked filterable.',
    };
  }
}
