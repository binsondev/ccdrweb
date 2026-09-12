import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { MeResponse, TenantMembership, TokenResponse } from './models';

const TOKEN_KEY = 'ccdr.accessToken';
const REFRESH_KEY = 'ccdr.refreshToken';
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
  refreshToken: string | null;
  me: MeResponse | null;
  tenants: TenantMembership[];
  tenantSlug: string | null;
  loading: boolean;
  ready: boolean;
  error: string | null;
};

const initial: AuthState = {
  token: readStorage(TOKEN_KEY),
  refreshToken: readStorage(REFRESH_KEY),
  me: null,
  tenants: [],
  tenantSlug: readStorage(TENANT_KEY),
  loading: false,
  ready: !readStorage(TOKEN_KEY) && !readStorage(REFRESH_KEY),
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.token() || !!store.refreshToken()),
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
    canExport: computed(() => {
      const membership = store.tenants().find((tenant) => tenant.tenant === store.tenantSlug());
      return !!membership && (membership.exportGranted || membership.role === 'TenantAdmin');
    }),
    canSettingsWrite: computed(() => {
      const role = store.tenants().find((tenant) => tenant.tenant === store.tenantSlug())?.role;
      return role === 'TenantAdmin';
    }),
  })),
  withMethods((store, api = inject(Api), router = inject(Router)) => {
    let refreshInFlight: Promise<boolean> | null = null;

    const persist = (tokens: { access: string | null; refresh: string | null }, slug: string | null) => {
      try {
        if (tokens.access) localStorage.setItem(TOKEN_KEY, tokens.access);
        else localStorage.removeItem(TOKEN_KEY);
        if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh);
        else localStorage.removeItem(REFRESH_KEY);
        if (slug) localStorage.setItem(TENANT_KEY, slug);
        else localStorage.removeItem(TENANT_KEY);
      } catch {
        /* ignore quota / private mode */
      }
    };

    const applyTokens = (issued: TokenResponse) => {
      persist({ access: issued.accessToken, refresh: issued.refreshToken }, store.tenantSlug());
      patchState(store, { token: issued.accessToken, refreshToken: issued.refreshToken });
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
      persist({ access: store.token(), refresh: store.refreshToken() }, nextSlug);
      patchState(store, {
        me,
        tenants: mine.tenants,
        tenantSlug: nextSlug,
        loading: false,
        ready: true,
        error: null,
      });
    };

    const clearSession = () => {
      persist({ access: null, refresh: null }, null);
      patchState(store, {
        token: null,
        refreshToken: null,
        me: null,
        tenants: [],
        tenantSlug: null,
        loading: false,
        ready: true,
        error: null,
      });
    };

    return {
      homePath(): string {
        return store.tenantSlug() ? '/app/customers' : '/app/platform';
      },
      async login(username: string, password: string) {
        patchState(store, { loading: true, error: null });
        try {
          const issued = await api.login(username, password);
          applyTokens(issued);
          await loadSession();
          await router.navigateByUrl(store.tenantSlug() ? '/app/customers' : '/app/platform');
        } catch (err) {
          persist({ access: null, refresh: null }, store.tenantSlug());
          patchState(store, {
            token: null,
            refreshToken: null,
            me: null,
            loading: false,
            ready: true,
            error: apiMessage(err),
          });
        }
      },
      refreshTokens() {
        const current = store.refreshToken();
        if (!current) return Promise.resolve(false);
        if (refreshInFlight) return refreshInFlight;
        refreshInFlight = (async () => {
          try {
            applyTokens(await api.refresh(current));
            return true;
          } catch {
            return false;
          } finally {
            refreshInFlight = null;
          }
        })();
        return refreshInFlight;
      },
      async restore() {
        if (!store.token() && !store.refreshToken()) {
          patchState(store, { ready: true, loading: false });
          return;
        }
        patchState(store, { loading: true });
        try {
          await loadSession();
        } catch {
          const current = store.refreshToken();
          let refreshed = false;
          if (current) {
            try {
              applyTokens(await api.refresh(current));
              refreshed = true;
            } catch {
              refreshed = false;
            }
          }
          if (!refreshed) {
            clearSession();
            return;
          }
          try {
            await loadSession();
          } catch {
            clearSession();
          }
        }
      },
      async selectTenant(slug: string) {
        persist({ access: store.token(), refresh: store.refreshToken() }, slug);
        patchState(store, { tenantSlug: slug });
        try {
          const me = await api.me();
          patchState(store, { me });
        } catch {
          /* keep picker selection even if /me fails */
        }
      },
      logout() {
        const refresh = store.refreshToken();
        clearSession();
        if (refresh) {
          void api.logout(refresh).catch(() => undefined);
        }
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
