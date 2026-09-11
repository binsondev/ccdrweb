export function displayValue(value: unknown): string {
  if (value == null || value === '') {
    return '—';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

export function operatorLabel(op: string): string {
  switch (op) {
    case 'contains':
      return 'contains';
    case 'eq':
      return 'is';
    case 'gt':
      return '>';
    case 'gte':
      return '≥';
    case 'lt':
      return '<';
    case 'lte':
      return '≤';
    default:
      return op;
  }
}

export function initials(name: string | null | undefined, email: string): string {
  if (name?.trim()) {
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
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
