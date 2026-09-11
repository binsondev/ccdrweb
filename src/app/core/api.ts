import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  ApiProblem,
  AppRole,
  AttributeDefinition,
  AttributeListResponse,
  Customer,
  CustomerListResponse,
  DataType,
  DevTokenResponse,
  FilterableAttribute,
  MappingProfile,
  MappingProfileListResponse,
  MappingVersion,
  MeResponse,
  Member,
  MyTenantsResponse,
  PlatformTenant,
  SettingsResponse,
  UploadBatch,
} from './models';

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

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

  attributes() {
    return this.get<AttributeListResponse>('/api/attributes');
  }

  createAttribute(body: {
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
  }) {
    return this.post<AttributeDefinition>('/api/attributes', body);
  }

  updateAttribute(
    code: string,
    body: Partial<{
      label: string;
      group: string | null;
      required: boolean;
      matchKey: boolean;
      filterable: boolean;
      listVisible: boolean;
      pii: boolean;
      active: boolean;
      helpText: string | null;
    }>,
  ) {
    return this.put<AttributeDefinition>(`/api/attributes/${code}`, body);
  }

  filterableAttributes() {
    return this.get<{ tenant: string; attributes: FilterableAttribute[] }>(
      '/api/customers/filterable-attributes',
    );
  }

  customers(query: { q?: string; filter?: string[]; offset?: number; limit?: number }) {
    let params = new HttpParams();
    if (query.q) params = params.set('q', query.q);
    for (const filter of query.filter ?? []) {
      params = params.append('filter', filter);
    }
    if (query.offset) params = params.set('offset', String(query.offset));
    if (query.limit) params = params.set('limit', String(query.limit));
    return this.get<CustomerListResponse>('/api/customers', params);
  }

  saveCustomer(attributes: Record<string, unknown>) {
    return this.post<Customer>('/api/customers', { attributes });
  }

  mappingProfiles() {
    return this.get<MappingProfileListResponse>('/api/mapping-profiles');
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
    name: string;
    description?: string;
    headerRowIndex: number;
    ignoreUnmappedColumns: boolean;
    isDefault: boolean;
    bindings: { excelHeader: string; attributeCode: string; transforms: string[] }[];
  }) {
    return this.post<MappingProfile>('/api/mapping-profiles', body);
  }

  activateMapping(id: string) {
    return this.post<MappingProfile>(`/api/mapping-profiles/${id}/activate`, {});
  }

  uploads() {
    return this.get<{ tenant: string; batches: UploadBatch[] }>('/api/uploads');
  }

  getUpload(id: string) {
    return this.get<UploadBatch>(`/api/uploads/${id}`);
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
