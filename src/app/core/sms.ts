export interface SmsCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SmsTemplate {
  id: string;
  categoryId: string;
  name: string;
  senderId: string | null;
  dltTemplateId: string | null;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SmsJobRequest {
  templateId: string;
  phoneAttributeCodes: string[];
  variableMappings: Record<string, string>;
  savedSearchId?: string | null;
  recordType?: string | null;
  q?: string | null;
  filter?: string[];
  customerIds?: string[];
}

export interface SmsPreviewSample {
  customerId: string;
  phone: string;
  body: string;
}

export interface SmsPreview {
  requested: number;
  eligible: number;
  skippedNoPhone: number;
  skippedInvalid: number;
  skippedOptIn: number;
  overCap: boolean;
  maxRecipients: number;
  samples: SmsPreviewSample[];
}

export interface SmsProviderInfo {
  key: string;
  ready: boolean;
  active: boolean;
}

export interface SmsProviderList {
  active: string;
  providers: SmsProviderInfo[];
}

export interface SmsJob {
  id: string;
  status: string;
  audienceKind: string;
  savedSearchId: string | null;
  recordType: string | null;
  q: string | null;
  filter: string[];
  selectedCount: number;
  templateId: string;
  templateName: string;
  categoryId: string;
  categoryName: string;
  phoneAttributeCodes: string[];
  providerKey: string;
  providerBatchId: string | null;
  requested: number;
  skippedNoPhone: number;
  skippedInvalid: number;
  skippedOptIn: number;
  submitted: number;
  createdByName: string | null;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export function smsPlaceholders(body: string) {
  const found = body.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g);
  return [...new Set([...found].map((match) => match[1]))];
}
