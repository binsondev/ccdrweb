export function displayValue(value: unknown): string {
  if (value == null || value === '') {
    return '—';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case 'PlatformAdmin':
      return 'Platform admin';
    case 'TenantAdmin':
      return 'Tenant admin';
    case 'Uploader':
      return 'Uploader';
    case 'QueryUser':
      return 'Query user';
    default:
      return role ?? 'Unknown';
  }
}
