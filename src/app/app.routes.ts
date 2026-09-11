import { Routes } from '@angular/router';
import { authGuard, guestGuard, platformGuard, tenantGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login').then((m) => m.LoginPage),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'customers' },
      {
        path: 'customers',
        canActivate: [tenantGuard],
        loadComponent: () => import('./pages/customers').then((m) => m.CustomersPage),
      },
      {
        path: 'attributes',
        canActivate: [tenantGuard],
        loadComponent: () => import('./pages/attributes').then((m) => m.AttributesPage),
      },
      {
        path: 'members',
        canActivate: [tenantGuard],
        loadComponent: () => import('./pages/members').then((m) => m.MembersPage),
      },
      {
        path: 'mappings',
        canActivate: [tenantGuard],
        loadComponent: () => import('./pages/mappings').then((m) => m.MappingsPage),
      },
      {
        path: 'uploads',
        canActivate: [tenantGuard],
        loadComponent: () => import('./pages/uploads').then((m) => m.UploadsPage),
      },
      {
        path: 'settings',
        canActivate: [tenantGuard],
        loadComponent: () => import('./pages/settings').then((m) => m.SettingsPage),
      },
      {
        path: 'platform',
        canActivate: [platformGuard],
        loadComponent: () => import('./pages/platform').then((m) => m.PlatformPage),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
