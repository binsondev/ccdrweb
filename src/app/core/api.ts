import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  ApiProblem,
  AppRole,
  AttributeDefinition,
  AttributeListResponse,
  AttributeOption,
  Customer,
  CustomerListResponse,
  DataType,
  DevTokenResponse,
  FilterableAttribute,
  TokenResponse,
  MappingPreview,
  MappingProfile,
  MappingProfileListResponse,
  MappingVersion,
  MeResponse,
  Member,
  MyTenantsResponse,
  PlatformTenant,
  RecordType,
  RecordTypeListResponse,
  SavedSearch,
  SavedSearchListResponse,
  SettingsResponse,
  StagedRow,
  UploadBatch,
} from './models';

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

  login(username: string, password: string) {
    return this.post<TokenResponse>('/api/auth/login', { username, password });
  }

  refresh(refreshToken: string) {
    return this.post<TokenResponse>('/api/auth/refresh', { refreshToken });
  }

  logout(refreshToken: string | null) {
    return this.post<void>('/api/auth/logout', { refreshToken });
  }

  issueDevToken(email: string) {
    return this.post<DevTokenResponse>('/api/dev/token', { email });
  }

  me() {
    return this.get<MeResponse>('/api/me');
  }

  myTenants() {
    return this.get<MyTenantsResponse>('/api/me/tenants');
  }

  members() {
    return this.get<{ tenant: string; members: Member[] }>('/api/members');
  }

  addMember(email: string, role: AppRole, exportGranted: boolean) {
    return this.post<Member>('/api/members', { email, role, exportGranted });
  }

  updateMember(id: string, role: AppRole, exportGranted: boolean) {
    return this.put<Member>(`/api/members/${id}`, { id, role, exportGranted });
  }

  removeMember(id: string) {
    return this.delete(`/api/members/${id}`);
  }

  recordTypes() {
    return this.get<RecordTypeListResponse>('/api/record-types');
  }

  createRecordType(body: { code: string; label: string; description?: string | null; active?: boolean }) {
    return this.post<RecordType>('/api/record-types', { active: true, ...body });
  }

  updateRecordType(
    code: string,
    body: { label: string; description?: string | null; active: boolean },
  ) {
    return this.put<RecordType>(`/api/record-types/${code}`, { code, ...body });
  }

  attributes(recordType?: string | null) {
    let params = new HttpParams();
    if (recordType) params = params.set('recordType', recordType);
    return this.get<AttributeListResponse>('/api/attributes', params);
  }

  createAttribute(body: {
    recordType: string;
    code: string;
    label: string;
    group?: string | null;
    dataType: DataType;
    required: boolean;
    matchKey: boolean;
    filterable: boolean;
    listVisible: boolean;
    pii: boolean;
    active: boolean;
    helpText?: string | null;
    options?: AttributeOption[];
  }) {
    return this.post<AttributeDefinition>('/api/attributes', body);
  }

  updateAttribute(
    recordType: string,
    code: string,
    body: {
      label: string;
      group?: string | null;
      dataType: DataType;
      required: boolean;
      matchKey: boolean;
      filterable: boolean;
      listVisible: boolean;
      pii: boolean;
      active: boolean;
      helpText?: string | null;
      defaultValue?: string | null;
      sortOrder?: number;
      options?: AttributeOption[];
    },
  ) {
    return this.put<AttributeDefinition>(`/api/attributes/${recordType}/${code}`, { recordType, code, ...body });
  }

  filterableAttributes(recordType?: string | null) {
    let params = new HttpParams();
    if (recordType) params = params.set('recordType', recordType);
    return this.get<{ tenant: string; recordType: string | null; attributes: FilterableAttribute[] }>(
      '/api/customers/filterable-attributes',
      params,
    );
  }

  customers(query: { q?: string; recordType?: string | null; filter?: string[]; offset?: number; limit?: number }) {
    return firstValueFrom(this.customers$(query));
  }

  customers$(query: { q?: string; recordType?: string | null; filter?: string[]; offset?: number; limit?: number }) {
    let params = new HttpParams();
    if (query.q) params = params.set('q', query.q);
    if (query.recordType) params = params.set('recordType', query.recordType);
    for (const filter of query.filter ?? []) {
      params = params.append('filter', filter);
    }
    if (query.offset != null) params = params.set('offset', String(query.offset));
    if (query.limit != null) params = params.set('limit', String(query.limit));
    return this.http.get<CustomerListResponse>('/api/customers', { params });
  }

  saveCustomer(recordType: string, attributes: Record<string, unknown>, id?: string) {
    return this.post<Customer>('/api/customers', { id, recordType, attributes });
  }

  exportCustomers(query: {
    q?: string;
    recordType?: string | null;
    filter?: string[];
    format: 'xlsx' | 'csv';
  }) {
    let params = new HttpParams().set('format', query.format);
    if (query.q) params = params.set('q', query.q);
    if (query.recordType) params = params.set('recordType', query.recordType);
    for (const filter of query.filter ?? []) {
      params = params.append('filter', filter);
    }
    return this.download('/api/customers/export', params, `customers.${query.format}`);
  }

  savedSearches() {
    return this.get<SavedSearchListResponse>('/api/saved-searches');
  }

  createSavedSearch(body: { name: string; recordType?: string | null; q?: string | null; filter?: string[] }) {
    return this.post<SavedSearch>('/api/saved-searches', body);
  }

  updateSavedSearch(
    id: string,
    body: { name: string; recordType?: string | null; q?: string | null; filter?: string[] },
  ) {
    return this.put<SavedSearch>(`/api/saved-searches/${id}`, { id, ...body });
  }

  deleteSavedSearch(id: string) {
    return this.delete(`/api/saved-searches/${id}`);
  }

  mappingProfiles(recordType?: string | null) {
    let params = new HttpParams();
    if (recordType) params = params.set('recordType', recordType);
    return this.get<MappingProfileListResponse>('/api/mapping-profiles', params);
  }

  mappingProfile(id: string) {
    return this.get<MappingProfile>(`/api/mapping-profiles/${id}`);
  }

  mappingVersions(id: string) {
    return this.get<{ profileId: string; currentVersionId: string; versions: MappingVersion[] }>(
      `/api/mapping-profiles/${id}/versions`,
    );
  }

  createMappingProfile(body: {
    recordType: string;
    name: string;
    description?: string;
    headerRowIndex: number;
    ignoreUnmappedColumns: boolean;
    isDefault: boolean;
    bindings: {
      excelHeader: string;
      attributeCode: string;
      transforms: string[];
      dateFormat?: string | null;
    }[];
  }) {
    return this.post<MappingProfile>('/api/mapping-profiles', body);
  }

  updateMappingProfile(
    id: string,
    body: {
      name: string;
      description?: string | null;
      sheetName?: string | null;
      headerRowIndex: number;
      ignoreUnmappedColumns: boolean;
      isDefault: boolean;
      bindings: {
        excelHeader: string;
        attributeCode: string;
        transforms: string[];
        dateFormat?: string | null;
      }[];
    },
  ) {
    return this.put<MappingProfile>(`/api/mapping-profiles/${id}`, { id, ...body });
  }

  activateMapping(id: string) {
    return this.post<MappingProfile>(`/api/mapping-profiles/${id}/activate`, {});
  }

  cloneMapping(id: string, name?: string) {
    return this.post<MappingProfile>(`/api/mapping-profiles/${id}/clone`, name ? { name } : {});
  }

  downloadMappingTemplate(id: string) {
    return this.download(`/api/mapping-profiles/${id}/template.xlsx`, undefined, 'mapping-template.xlsx');
  }

  previewMapping(id: string, file: File, versionId?: string) {
    const data = new FormData();
    data.set('File', file, file.name);
    if (versionId) data.set('VersionId', versionId);
    return firstValueFrom(this.http.post<MappingPreview>(`/api/mapping-profiles/${id}/preview`, data));
  }

  uploads() {
    return this.get<{ tenant: string; batches: UploadBatch[] }>('/api/uploads');
  }

  getUpload(id: string) {
    return this.get<UploadBatch>(`/api/uploads/${id}`);
  }

  stagedRows(batchId: string, limit = 20) {
    return this.get<{ batchId: string; count: number; rows: StagedRow[] }>(
      `/api/uploads/${batchId}/staged-rows`,
      new HttpParams().set('limit', String(limit)),
    );
  }

  createUpload(mappingProfileId: string, file: File) {
    const data = new FormData();
    data.set('MappingProfileId', mappingProfileId);
    data.set('File', file, file.name);
    return firstValueFrom(this.http.post<UploadBatch>('/api/uploads', data));
  }

  commitUpload(batchId: string) {
    return this.post<UploadBatch>(`/api/uploads/${batchId}/commit`, {});
  }

  cancelUpload(batchId: string) {
    return this.post<UploadBatch>(`/api/uploads/${batchId}/cancel`, {});
  }

  downloadUploadErrors(batchId: string) {
    return this.download(`/api/uploads/${batchId}/errors.xlsx`, undefined, 'upload-errors.xlsx');
  }

  settings() {
    return this.get<SettingsResponse>('/api/settings');
  }

  saveSettings(uploadCommitPolicy: 'ValidOnly' | 'AllOrNothing') {
    return this.put<SettingsResponse>('/api/settings', { uploadCommitPolicy });
  }

  platformTenants() {
    return this.get<{ tenants: PlatformTenant[] }>('/api/platform/tenants');
  }

  createPlatformTenant(identifier: string, name: string, businessType: string) {
    return this.post<PlatformTenant>('/api/platform/tenants', { identifier, name, businessType });
  }

  assignTenantAdmin(tenantId: string, email: string) {
    return this.post<Member>(`/api/platform/tenants/${tenantId}/admins`, { tenantId, email });
  }

  private get<T>(url: string, params?: HttpParams) {
    return firstValueFrom(this.http.get<T>(url, { params }));
  }

  private post<T>(url: string, body: unknown) {
    return firstValueFrom(this.http.post<T>(url, body));
  }

  private put<T>(url: string, body: unknown) {
    return firstValueFrom(this.http.put<T>(url, body));
  }

  private delete(url: string) {
    return firstValueFrom(this.http.delete(url));
  }

  private async download(url: string, params?: HttpParams, fallbackName = 'download') {
    const response = await firstValueFrom(
      this.http.get(url, { params, observe: 'response', responseType: 'blob' }),
    );
    const blob = response.body;
    if (!blob || blob.size === 0) {
      throw new Error('The download was empty.');
    }
    return {
      blob,
      fileName: fileNameFromDisposition(response.headers.get('content-disposition')) ?? fallbackName,
    };
  }
}

export function saveBlob(file: { blob: Blob; fileName: string }) {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function fileNameFromDisposition(header: string | null) {
  if (!header) return null;
  const utf = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf?.[1]) {
    try {
      return decodeURIComponent(utf[1].trim());
    } catch {
      return utf[1].trim();
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1]?.trim() || null;
}

export function apiMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ApiProblem | string | null;
    if (body && typeof body === 'object' && body.message) {
      const details = body.errors ? Object.values(body.errors).flat().join(' ') : '';
      return details ? `${body.message} ${details}` : body.message;
    }
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    return error.statusText || `HTTP ${error.status}`;
  }
  return error instanceof Error ? error.message : 'Request failed.';
}
