import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthStore } from './auth.store';

const whenReady = () => {
  const auth = inject(AuthStore);
  return toObservable(auth.ready).pipe(
    filter((ready) => ready),
    take(1),
    map(() => auth),
  );
};

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return whenReady().pipe(
    map((auth) => (auth.isAuthenticated() ? true : router.createUrlTree(['/login']))),
  );
};

export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  return whenReady().pipe(
    map((auth) =>
      auth.isAuthenticated()
        ? router.createUrlTree([auth.homePath()])
        : true,
    ),
  );
};

export const tenantGuard: CanActivateFn = () => {
  const router = inject(Router);
  return whenReady().pipe(
    map((auth) => {
      if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
      if (auth.tenantSlug()) return true;
      return router.createUrlTree(['/app/platform']);
    }),
  );
};

export const platformGuard: CanActivateFn = () => {
  const router = inject(Router);
  return whenReady().pipe(
    map((auth) => {
      if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
      if (auth.isPlatformAdmin()) return true;
      return router.createUrlTree([auth.homePath()]);
    }),
  );
};
