import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { filter, map, startWith } from 'rxjs';
import { AuthStore } from '../core/auth.store';
import { ThemeStore } from '../core/theme.store';
import { roleLabel } from '../core/format';

@Component({
  selector: 'ccdr-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HlmBadge, HlmButton, HlmSeparator],
  template: `
    <div class="bg-background text-foreground min-h-dvh md:grid md:grid-cols-[15.5rem_minmax(0,1fr)]">
      <header class="border-border flex items-center justify-between border-b px-4 py-3 md:hidden">
        <p class="text-sm font-semibold tracking-tight">CCDR</p>
        <button hlmBtn variant="outline" size="sm" type="button" (click)="menuOpen.set(!menuOpen())">
          {{ menuOpen() ? 'Close' : 'Menu' }}
        </button>
      </header>

      <aside
        class="bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col border-b p-4 md:flex md:sticky md:top-0 md:h-dvh md:overflow-y-auto md:border-r md:border-b-0"
        [class.hidden]="!menuOpen()"
      >
        <a
          [routerLink]="home()"
          class="flex items-center gap-3 text-inherit no-underline"
          (click)="menuOpen.set(false)"
        >
          <span
            class="bg-sidebar-primary text-sidebar-primary-foreground grid size-8 place-items-center rounded-md text-[11px] font-semibold"
          >
            CC
          </span>
          <span>
            <span class="block text-sm font-semibold tracking-tight">CCDR</span>
            <span class="text-sidebar-foreground/50 text-[10px] tracking-[0.18em] uppercase">
              Customer master
            </span>
          </span>
        </a>

        @if (auth.tenants().length) {
          <div class="border-sidebar-border bg-sidebar-accent/50 mt-5 rounded-md border px-3 py-2.5">
            <p class="text-sidebar-foreground/45 text-[10px] tracking-[0.16em] uppercase">Workspace</p>
            <label class="sr-only" for="tenant">Tenant</label>
            <select
              id="tenant"
              class="border-sidebar-border bg-sidebar text-sidebar-foreground mt-1 h-8 w-full rounded-md border px-2 text-sm"
              [value]="auth.tenantSlug() ?? ''"
              (change)="onTenant($event)"
            >
              @for (tenant of auth.tenants(); track tenant.tenantId) {
                <option [value]="tenant.tenant">{{ tenant.name }}</option>
              }
            </select>
            @if (current(); as tenant) {
              <p class="text-sidebar-foreground/55 mt-1 text-xs">{{ tenant.businessType }} · {{ tenant.tenant }}</p>
            }
          </div>
        }

        <nav class="mt-5 grid gap-4 text-sm" aria-label="Primary">
          @for (group of nav(); track group.label) {
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
          <p class="text-sm font-medium">{{ auth.me()?.name || auth.me()?.email }}</p>
          <p class="text-sidebar-foreground/50 text-xs">{{ roleLabel(auth.role()) }}</p>
          <button hlmBtn variant="secondary" size="sm" class="mt-3 w-full" type="button" (click)="theme.toggle()">
            {{ theme.label() }} theme
          </button>
          <button hlmBtn variant="ghost" size="sm" class="mt-1 w-full" type="button" (click)="auth.logout()">
            Sign out
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
export class Shell {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthStore);
  protected readonly theme = inject(ThemeStore);
  protected readonly menuOpen = signal(false);
  protected readonly roleLabel = roleLabel;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly current = computed(() => this.auth.currentMembership());
  protected readonly home = computed(() => this.auth.homePath());
  protected readonly title = computed(() => this.meta().title);
  protected readonly kicker = computed(() => this.meta().kicker);
  protected readonly blurb = computed(() => this.meta().blurb);
  protected readonly envLabel = computed(() => {
    const tenant = this.current();
    const mode = this.theme.dark() ? 'Dark' : 'Light';
    return tenant ? `${mode} · ${tenant.name}` : `${mode} · Platform`;
  });

  protected readonly nav = computed(() => {
    const groups: { label: string; items: { path: string; label: string; hint: string }[] }[] = [];
    if (this.auth.tenantSlug()) {
      groups.push({
        label: 'Records',
        items: [{ path: '/app/customers', label: 'Customers', hint: 'Faceted search' }],
      });
      groups.push({
        label: 'Catalog',
        items: [{ path: '/app/attributes', label: 'Attributes', hint: 'Define the shape' }],
      });
      const intake: { path: string; label: string; hint: string }[] = [];
      if (this.auth.canMappings()) {
        intake.push({ path: '/app/mappings', label: 'Mappings', hint: 'Bind Excel headers' });
      }
      if (this.auth.canUpload()) {
        intake.push({ path: '/app/uploads', label: 'Uploads', hint: 'Stage, then commit' });
      }
      if (intake.length) groups.push({ label: 'Intake', items: intake });
      const access: { path: string; label: string; hint: string }[] = [];
      if (this.auth.canMembers()) {
        access.push({ path: '/app/members', label: 'Members', hint: 'Who may enter' });
      }
      if (this.auth.canMappings()) {
        access.push({ path: '/app/settings', label: 'Settings', hint: 'Commit policy' });
      }
      if (access.length) groups.push({ label: 'Access', items: access });
    }
    if (this.auth.isPlatformAdmin()) {
      groups.push({
        label: 'Platform',
        items: [{ path: '/app/platform', label: 'Tenants', hint: 'All workspaces' }],
      });
    }
    return groups;
  });

  protected async onTenant(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.menuOpen.set(false);
    await this.auth.selectTenant(value);
  }

  private meta() {
    const url = this.url();
    if (url.includes('/attributes')) {
      return {
        kicker: 'Catalog',
        title: 'Attributes',
        blurb: 'There is no fixed Customer class. These fields are the record.',
      };
    }
    if (url.includes('/mappings/')) {
      return {
        kicker: 'Intake',
        title: 'Mapping overview',
        blurb: 'Current version, Excel header bindings, and history for this profile.',
      };
    }
    if (url.includes('/mappings')) {
      return {
        kicker: 'Intake',
        title: 'Excel mappings',
        blurb: 'Map headers to catalog codes. Column order is never guessed.',
      };
    }
    if (url.includes('/uploads')) {
      return {
        kicker: 'Intake',
        title: 'Excel intake',
        blurb: 'Stage a workbook against an activated mapping, then commit.',
      };
    }
    if (url.includes('/members')) {
      return {
        kicker: 'Access',
        title: 'Members',
        blurb: 'Invite by email. The seat links on first sign-in.',
      };
    }
    if (url.includes('/settings')) {
      return {
        kicker: 'Access',
        title: 'Tenant settings',
        blurb: 'Commit writes valid rows, or nothing if any row fails.',
      };
    }
    if (url.includes('/platform')) {
      return {
        kicker: 'Platform',
        title: 'Tenants',
        blurb: 'Platform admins create workspaces. They do not see customer rows.',
      };
    }
    return {
      kicker: 'Records',
      title: 'Customer search',
      blurb: 'Filters are generated from GET /api/customers/filterable-attributes.',
    };
  }
}
