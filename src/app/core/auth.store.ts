import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { MeResponse, TenantMembership } from './models';

const TOKEN_KEY = 'ccdr.accessToken';
const TENANT_KEY = 'ccdr.tenant';

const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

type AuthState = {
  token: string | null;
  me: MeResponse | null;
  tenants: TenantMembership[];
  tenantSlug: string | null;
  loading: boolean;
  ready: boolean;
  error: string | null;
};

const initial: AuthState = {
  token: readStorage(TOKEN_KEY),
  me: null,
  tenants: [],
  tenantSlug: readStorage(TENANT_KEY),
  loading: false,
  ready: !readStorage(TOKEN_KEY),
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.token()),
    isPlatformAdmin: computed(() => store.me()?.platformAdmin === true),
    currentMembership: computed(() => {
      const slug = store.tenantSlug();
      return store.tenants().find((tenant) => tenant.tenant === slug) ?? null;
    }),
    role: computed(() => {
      const membership = store.tenants().find((tenant) => tenant.tenant === store.tenantSlug());
      if (membership) return membership.role;
      return store.me()?.platformAdmin ? 'PlatformAdmin' : null;
    }),
    canCatalogWrite: computed(() => {
      const role = store.tenants().find((tenant) => tenant.tenant === store.tenantSlug())?.role;
      return role === 'TenantAdmin';
    }),
    canMembers: computed(() => {
      const role = store.tenants().find((tenant) => tenant.tenant === store.tenantSlug())?.role;
      return role === 'TenantAdmin';
    }),
    canMappings: computed(() => {
      const role = store.tenants().find((tenant) => tenant.tenant === store.tenantSlug())?.role;
      return role === 'TenantAdmin' || role === 'Uploader';
    }),
    canUpload: computed(() => {
      const role = store.tenants().find((tenant) => tenant.tenant === store.tenantSlug())?.role;
      return role === 'TenantAdmin' || role === 'Uploader';
    }),
    canCustomerWrite: computed(() => {
      const role = store.tenants().find((tenant) => tenant.tenant === store.tenantSlug())?.role;
      return role === 'TenantAdmin' || role === 'Uploader';
    }),
    canSettingsWrite: computed(() => {
      const role = store.tenants().find((tenant) => tenant.tenant === store.tenantSlug())?.role;
      return role === 'TenantAdmin';
    }),
  })),
  withMethods((store, api = inject(Api), router = inject(Router)) => {
    const persist = (token: string | null, slug: string | null) => {
      try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
        if (slug) localStorage.setItem(TENANT_KEY, slug);
        else localStorage.removeItem(TENANT_KEY);
      } catch {
        /* ignore quota / private mode */
      }
    };

    const loadSession = async () => {
      const me = await api.me();
      const mine = await api.myTenants();
      const preferred = store.tenantSlug();
      const nextSlug =
        (preferred && mine.tenants.some((tenant) => tenant.tenant === preferred)
          ? preferred
          : null) ??
        mine.tenants[0]?.tenant ??
        null;
      persist(store.token(), nextSlug);
      patchState(store, {
        me,
        tenants: mine.tenants,
        tenantSlug: nextSlug,
        loading: false,
        ready: true,
        error: null,
      });
    };

    return {
      homePath(): string {
        return store.tenantSlug() ? '/app/customers' : '/app/platform';
      },
      async login(email: string) {
        patchState(store, { loading: true, error: null });
        try {
          const issued = await api.issueDevToken(email);
          persist(issued.accessToken, store.tenantSlug());
          patchState(store, { token: issued.accessToken });
          await loadSession();
          await router.navigateByUrl(store.tenantSlug() ? '/app/customers' : '/app/platform');
        } catch (err) {
          persist(null, store.tenantSlug());
          patchState(store, {
            token: null,
            me: null,
            loading: false,
            ready: true,
            error: apiMessage(err),
          });
        }
      },
      async restore() {
        if (!store.token()) {
          patchState(store, { ready: true, loading: false });
          return;
        }
        patchState(store, { loading: true });
        try {
          await loadSession();
        } catch {
          persist(null, null);
          patchState(store, {
            token: null,
            me: null,
            tenants: [],
            tenantSlug: null,
            loading: false,
            ready: true,
            error: null,
          });
        }
      },
      async selectTenant(slug: string) {
        persist(store.token(), slug);
        patchState(store, { tenantSlug: slug });
        try {
          const me = await api.me();
          patchState(store, { me });
        } catch {
          /* keep picker selection even if /me fails */
        }
      },
      logout() {
        persist(null, null);
        patchState(store, {
          token: null,
          me: null,
          tenants: [],
          tenantSlug: null,
          loading: false,
          ready: true,
          error: null,
        });
        void router.navigateByUrl('/login');
      },
    };
  }),
  withHooks({
    onInit(store) {
      void store.restore();
    },
  }),
);
