import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from './auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/api/dev/token')) {
    return next(req);
  }

  const auth = inject(AuthStore);
  const token = auth.token();
  const tenant = auth.tenantSlug();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenant && !req.url.startsWith('/api/platform')) {
    headers['X-Tenant'] = tenant;
  }
  return next(Object.keys(headers).length ? req.clone({ setHeaders: headers }) : req);
};
