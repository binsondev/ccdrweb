export type AppRole = 'TenantAdmin' | 'Uploader' | 'QueryUser';
export type DataType =
  | 'Text'
  | 'Multiline'
  | 'Integer'
  | 'Decimal'
  | 'Date'
  | 'DateTime'
  | 'Boolean'
  | 'Phone'
  | 'Email'
  | 'Dropdown';

export const DATA_TYPES: DataType[] = [
  'Text',
  'Multiline',
  'Integer',
  'Decimal',
  'Date',
  'DateTime',
  'Boolean',
  'Phone',
  'Email',
  'Dropdown',
];

export const MEMBER_ROLES: AppRole[] = ['TenantAdmin', 'Uploader', 'QueryUser'];

export const BUSINESS_TYPES = ['Hospital', 'Shop', 'School', 'Other'] as const;

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  refreshExpiresInSeconds: number;
}

export interface DevTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  issuer: string;
  audience: string;
  email: string;
  platformAdmin: boolean;
  tenants: string[];
  note: string;
}

export interface MeResponse {
  userId: string;
  subject: string;
  issuer: string;
  email: string | null;
  name: string | null;
  platformAdmin: boolean;
  currentTenant: string | null;
  currentRole: AppRole | null;
  exportGranted: boolean;
}

export interface TenantMembership {
  tenantId: string;
  tenant: string;
  name: string;
  businessType: string;
  role: AppRole;
  exportGranted: boolean;
}

export interface MyTenantsResponse {
  userId: string;
  platformAdmin: boolean;
  tenants: TenantMembership[];
}

export interface Member {
  id: string;
  userId: string | null;
  email: string;
  name: string | null;
  tenant: string;
  role: AppRole;
  exportGranted: boolean;
  pendingLogin: boolean;
  createdAt: string;
}

export interface AttributeOption {
  value: string;
  label: string;
  sortOrder: number;
}

export interface RecordType {
  code: string;
  label: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecordTypeListResponse {
  tenant: string;
  recordTypes: RecordType[];
}

export interface AttributeDefinition {
  recordType: string;
  code: string;
  label: string;
  group: string | null;
  dataType: DataType;
  required: boolean;
  matchKey: boolean;
  filterable: boolean;
  listVisible: boolean;
  pii: boolean;
  active: boolean;
  helpText: string | null;
  defaultValue: string | null;
  sortOrder: number;
  options: AttributeOption[];
  createdAt: string;
  updatedAt: string;
}

export interface AttributeListResponse {
  tenant: string;
  businessType: string;
  recordType: string | null;
  hasMatchKey: boolean;
  matchKeyWarning: string | null;
  attributes: AttributeDefinition[];
}

export interface FilterableAttribute {
  recordType: string;
  code: string;
  label: string;
  group: string | null;
  dataType: DataType;
  operators: string[];
  options: AttributeOption[];
}

export interface Customer {
  id: string;
  tenant: string;
  tenantId: string;
  recordType: string;
  attributes: Record<string, unknown>;
  sourceBatchId: string | null;
  createdAt: string;
  updatedAt: string;
  outcome: string;
}

export interface CustomerListResponse {
  tenant: string;
  recordType: string | null;
  offset: number;
  limit: number;
  count: number;
  appliedFilters: { code: string; op: string; value: string }[];
  customers: Customer[];
}

export const CELL_TRANSFORMS = ['Trim', 'Upper', 'Lower', 'DigitsOnly'] as const;
export type CellTransform = (typeof CELL_TRANSFORMS)[number];

export const CELL_TRANSFORM_OPTIONS: { value: CellTransform; label: string; hint: string }[] = [
  { value: 'Trim', label: 'Trim', hint: 'Strip leading and trailing spaces' },
  { value: 'Upper', label: 'Uppercase', hint: 'Force A–Z' },
  { value: 'Lower', label: 'Lowercase', hint: 'Force a–z' },
  { value: 'DigitsOnly', label: 'Digits only', hint: 'Keep 0–9' },
];

export interface MappingBindingDraft {
  excelHeader: string;
  attributeCode: string;
  transforms: string[];
  dateFormat: string;
}

export function emptyBindingDraft(): MappingBindingDraft {
  return { excelHeader: '', attributeCode: '', transforms: [], dateFormat: '' };
}

export interface MappingBinding {
  excelHeader: string;
  attributeCode: string;
  transforms: string[];
  dateFormat: string | null;
}

export interface MappingVersion {
  id: string;
  versionNumber: number;
  sheetName: string | null;
  headerRowIndex: number;
  ignoreUnmappedColumns: boolean;
  activated: boolean;
  usedInCommit: boolean;
  immutable: boolean;
  bindings: MappingBinding[];
  missingRequiredBindings: string[];
  createdAt: string;
}

export interface MappingProfile {
  id: string;
  tenant: string;
  recordType: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  current: MappingVersion;
  createdAt: string;
  updatedAt: string;
}

export interface MappingProfileListResponse {
  tenant: string;
  profiles: MappingProfile[];
}

export interface MappingPreviewCell {
  attributeCode: string;
  excelHeader: string;
  value: string | null;
  message: string | null;
  raw?: string | null;
}

export interface MappingPreviewRow {
  excelRow: number;
  status: string;
  cells: MappingPreviewCell[];
  messages: string[];
}

export interface MappingPreview {
  profileId: string;
  versionId: string;
  versionNumber: number;
  activated: boolean;
  sheetName: string;
  headerRowIndex: number;
  headers: string[];
  ignoredHeaders: string[];
  missingHeaders: string[];
  rows: MappingPreviewRow[];
}

export interface StagedRowError {
  attributeCode: string | null;
  excelHeader: string | null;
  message: string;
}

export interface StagedRow {
  id: string;
  excelRow: number;
  status: string;
  values: Record<string, unknown>;
  errors: StagedRowError[];
}

export interface UploadBatch {
  id: string;
  tenant: string;
  status: string;
  mappingProfileId: string;
  mappingProfileName: string;
  mappingVersionId: string;
  mappingVersionNumber: number;
  fileName: string;
  sizeBytes: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  reviewRows: number;
  createdCount: number;
  updatedCount: number;
  failureMessage: string | null;
  ignoredHeaders: string[];
  missingHeaders: string[];
  commitPolicy: string;
  uploader: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsResponse {
  tenant: string;
  uploadCommitPolicy: 'ValidOnly' | 'AllOrNothing';
  updatedAt?: string | null;
}

export interface PlatformTenant {
  id: string;
  identifier: string;
  name: string;
  businessType: string;
  source: string;
}

export interface ApiProblem {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

export const DEV_USERS = [
  { email: 'platform@local', label: 'Platform admin', hint: 'Create tenants and first admins' },
  { email: 'acme.admin@local', label: 'Acme admin', hint: 'Hospital tenant catalog' },
  { email: 'acme.upload@local', label: 'Acme uploader', hint: 'Customers and Excel uploads' },
  { email: 'acme.query@local', label: 'Acme query', hint: 'Search customers only' },
  { email: 'globex.admin@local', label: 'Globex admin', hint: 'Shop tenant catalog' },
  { email: 'dual@local', label: 'Dual membership', hint: 'Acme and Globex' },
] as const;
