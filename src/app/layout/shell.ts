import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { AuthStore } from '../core/auth.store';
import { roleLabel } from '../core/format';

@Component({
  selector: 'ccdr-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HlmButton, HlmSeparator],
  template: `
    <div class="bg-background min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      <header class="border-border flex items-center justify-between border-b px-4 py-3 md:hidden">
        <a routerLink="/app/customers" class="font-semibold tracking-tight">CCDR</a>
        <button hlmBtn variant="outline" size="sm" type="button" (click)="menuOpen.set(!menuOpen())">
          {{ menuOpen() ? 'Close' : 'Menu' }}
        </button>
      </header>

      <aside
        class="border-border bg-sidebar text-sidebar-foreground flex flex-col border-b p-4 md:min-h-dvh md:border-r md:border-b-0"
        [class.hidden]="!menuOpen()"
      >
        <div class="mb-6 hidden md:block">
          <p class="text-lg font-semibold tracking-tight">CCDR</p>
          <p class="text-muted-foreground text-xs">Central Customer Data Repository</p>
        </div>

        @if (auth.tenants().length) {
          <label class="text-muted-foreground mb-1 block text-xs font-medium" for="tenant">
            Tenant
          </label>
          <select
            id="tenant"
            class="border-input bg-background mb-4 h-9 w-full rounded-md border px-2 text-sm"
            [value]="auth.tenantSlug() ?? ''"
            (change)="onTenant($event)"
          >
            @for (tenant of auth.tenants(); track tenant.tenantId) {
              <option [value]="tenant.tenant">{{ tenant.name }} ({{ tenant.tenant }})</option>
            }
          </select>
        }

        <nav class="grid gap-1 text-sm" aria-label="Primary">
          @for (item of nav(); track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground"
              class="hover:bg-sidebar-accent rounded-md px-3 py-2"
              (click)="menuOpen.set(false)"
            >
              {{ item.label }}
            </a>
          }
        </nav>

        <div hlmSeparator class="my-4"></div>

        <div class="text-muted-foreground mt-auto grid gap-1 text-xs">
          <p>{{ auth.me()?.email }}</p>
          <p>{{ roleLabel(auth.role()) }}</p>
          <button hlmBtn variant="ghost" size="sm" type="button" class="mt-2 justify-start" (click)="auth.logout()">
            Sign out
          </button>
        </div>
      </aside>

      <main class="min-w-0 p-4 md:p-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class Shell {
  protected readonly auth = inject(AuthStore);
  protected readonly menuOpen = signal(false);
  protected readonly roleLabel = roleLabel;

  protected readonly nav = computed(() => {
    const items: { path: string; label: string }[] = [];
    if (this.auth.tenantSlug()) {
      items.push({ path: '/app/customers', label: 'Customers' });
      items.push({ path: '/app/attributes', label: 'Attributes' });
      if (this.auth.canMembers()) items.push({ path: '/app/members', label: 'Members' });
      if (this.auth.canMappings()) items.push({ path: '/app/mappings', label: 'Mappings' });
      if (this.auth.canUpload()) items.push({ path: '/app/uploads', label: 'Uploads' });
      if (this.auth.canMappings()) items.push({ path: '/app/settings', label: 'Settings' });
    }
    if (this.auth.isPlatformAdmin()) {
      items.push({ path: '/app/platform', label: 'Platform' });
    }
    return items;
  });

  protected async onTenant(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.menuOpen.set(false);
    await this.auth.selectTenant(value);
  }
}
