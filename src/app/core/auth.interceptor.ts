import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from './auth.store';

const AUTH_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/dev/token'];

function isAuthRoute(url: string) {
  return AUTH_PATHS.some((path) => url.includes(path));
}

function withAuth<T>(req: HttpRequest<T>, auth: { token: () => string | null; tenantSlug: () => string | null }) {
  const token = auth.token();
  const tenant = auth.tenantSlug();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenant && !req.url.startsWith('/api/platform')) {
    headers['X-Tenant'] = tenant;
  }
  return Object.keys(headers).length ? req.clone({ setHeaders: headers }) : req;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (isAuthRoute(req.url)) {
    return next(req);
  }

  const auth = inject(AuthStore);
  return next(withAuth(req, auth)).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || req.headers.has('X-Retry-Auth')) {
        return throwError(() => err);
      }

      return from(auth.refreshTokens()).pipe(
        switchMap((ok) => {
          if (!ok) {
            auth.logout();
            return throwError(() => err);
          }
          return next(withAuth(req.clone({ setHeaders: { 'X-Retry-Auth': '1' } }), auth));
        }),
      );
    }),
  );
};
