import { Routes } from '@angular/router';
import { authGuard, guestGuard, platformGuard, tenantGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'prototype/login',
    loadComponent: () => import('./prototype/login').then((m) => m.PrototypeLogin),
  },
  {
    path: 'prototype',
    loadComponent: () => import('./prototype/shell').then((m) => m.PrototypeShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'customers' },
      {
        path: 'customers',
        loadComponent: () => import('./prototype/customers').then((m) => m.PrototypeCustomers),
      },
      {
        path: 'attributes',
        loadComponent: () => import('./prototype/attributes').then((m) => m.PrototypeAttributes),
      },
      {
        path: 'intake',
        loadComponent: () => import('./prototype/intake').then((m) => m.PrototypeIntake),
      },
      {
        path: 'members',
        loadComponent: () => import('./prototype/members').then((m) => m.PrototypeMembers),
      },
      {
        path: 'settings',
        loadComponent: () => import('./prototype/settings').then((m) => m.PrototypeSettings),
      },
      {
        path: 'tenants',
        loadComponent: () => import('./prototype/tenants').then((m) => m.PrototypeTenants),
      },
    ],
  },
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
