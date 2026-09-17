import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { filter, map, startWith } from 'rxjs';
import { BrandMark } from '../shared/brand-mark';
import { protoNav } from './mock';
import { PrototypeThemeStore } from './theme';

@Component({
  selector: 'ccdr-proto-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HlmBadge, HlmButton, HlmSeparator, BrandMark],
  template: `
    <div
      class="ccdr-proto bg-background text-foreground min-h-dvh md:grid md:grid-cols-[17rem_minmax(0,1fr)]"
      [class.dark]="theme.dark()"
    >
      <div
        class="bg-primary text-primary-foreground col-span-full flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[11px] font-medium tracking-wide"
      >
        <span>Enterprise prototype · mock Acme Health · theme tokens from Spartan</span>
        <a routerLink="/login" class="underline underline-offset-2">Live app</a>
      </div>

      <header class="border-border flex items-center justify-between border-b px-4 py-3 md:hidden">
        <ccdr-brand-mark />
        <button hlmBtn variant="outline" size="sm" type="button" (click)="menuOpen.set(!menuOpen())">
          {{ menuOpen() ? 'Close' : 'Menu' }}
        </button>
      </header>

      <aside
        class="bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col border-b p-4 md:flex md:sticky md:top-0 md:h-dvh md:overflow-y-auto md:border-r md:border-b-0"
        [class.hidden]="!menuOpen()"
      >
        <a
          routerLink="/prototype/search"
          class="text-inherit no-underline"
          (click)="menuOpen.set(false)"
        >
          <ccdr-brand-mark />
        </a>

        <div class="border-sidebar-border bg-sidebar-accent/50 mt-5 rounded-md border px-3 py-2.5">
          <p class="text-sidebar-foreground/45 text-[10px] tracking-[0.16em] uppercase">Workspace</p>
          <p class="mt-0.5 text-sm font-medium">Acme Health</p>
          <p class="text-sidebar-foreground/55 text-xs">Hospital · acme</p>
        </div>

        <nav class="mt-5 grid gap-4 text-sm" aria-label="Prototype">
          @for (group of nav; track group.label) {
            <div>
              <p class="text-sidebar-foreground/40 mb-1 px-2 text-[10px] tracking-[0.18em] uppercase">
                {{ group.label }}
              </p>
              <div class="grid gap-0.5">
                @for (item of group.items; track item.path) {
                  <a
                    [routerLink]="item.path"
                    routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground"
                    class="hover:bg-sidebar-accent/70 rounded-md px-2.5 py-1.5"
                    (click)="menuOpen.set(false)"
                  >
                    <span class="block leading-tight">{{ item.label }}</span>
                    <span class="text-sidebar-foreground/45 text-[11px]">{{ item.hint }}</span>
                  </a>
                }
              </div>
            </div>
          }
        </nav>

        <div class="mt-auto pt-6">
          <hlm-separator class="bg-sidebar-border mb-4" />
          <p class="text-sm font-medium">Maya Iyer</p>
          <p class="text-sidebar-foreground/50 text-xs">Tenant admin · acme.admin@local</p>
          <button hlmBtn variant="secondary" size="sm" class="mt-3 w-full" type="button" (click)="theme.toggle()">
            {{ theme.label() }} theme
          </button>
        </div>
      </aside>

      <main class="bg-background min-w-0">
        <header class="border-border flex flex-wrap items-end justify-between gap-4 border-b px-4 py-5 md:px-8">
          <div>
            <p class="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
              {{ kicker() }}
            </p>
            <h1 class="text-2xl font-semibold tracking-tight">{{ title() }}</h1>
            <p class="text-muted-foreground mt-1 max-w-2xl text-sm">{{ blurb() }}</p>
          </div>
          <span hlmBadge variant="outline">{{ envLabel() }}</span>
        </header>
        <div class="px-4 py-6 md:px-8">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class PrototypeShell {
  private readonly router = inject(Router);
  protected readonly theme = inject(PrototypeThemeStore);
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
  protected readonly envLabel = computed(() => (this.theme.dark() ? 'Dark · Acme' : 'Light · Acme'));

  private meta() {
    const url = this.url();
    if (url.includes('search')) {
      return {
        kicker: 'Records',
        title: 'Customer search',
        blurb: 'Search any value, or narrow the list with catalog filters.',
      };
    }
    if (url.includes('attributes')) {
      return {
        kicker: 'Catalog',
        title: 'Attributes',
        blurb: 'There is no fixed Customer class. These fields are the record.',
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
      blurb: 'Search any value, or open faceted search for catalog-driven filters.',
    };
  }
}
