export interface EmailCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  categoryId: string;
  name: string;
  subject: string;
  body: string;
  fromName: string | null;
  fromAddress: string | null;
  footer: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailJobRequest {
  templateId: string;
  emailAttributeCodes: string[];
  variableMappings: Record<string, string>;
  savedSearchId?: string | null;
  recordType?: string | null;
  q?: string | null;
  filter?: string[];
  customerIds?: string[];
}

export interface EmailPreviewSample {
  customerId: string;
  address: string;
  subject: string;
  body: string;
}

export interface EmailPreview {
  requested: number;
  eligible: number;
  skippedNoEmail: number;
  skippedInvalid: number;
  skippedOptIn: number;
  overCap: boolean;
  maxRecipients: number;
  samples: EmailPreviewSample[];
}

export interface EmailProviderInfo {
  key: string;
  ready: boolean;
  active: boolean;
}

export interface EmailProviderList {
  active: string;
  providers: EmailProviderInfo[];
}

export interface EmailJob {
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
  emailAttributeCodes: string[];
  providerKey: string;
  providerBatchId: string | null;
  requested: number;
  skippedNoEmail: number;
  skippedInvalid: number;
  skippedOptIn: number;
  submitted: number;
  createdByName: string | null;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export function emailPlaceholders(template: Pick<EmailTemplate, 'subject' | 'body' | 'footer'> | null) {
  const text = [template?.subject, template?.body, template?.footer].filter(Boolean).join('\n');
  const found = text.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g);
  return [...new Set([...found].map((match) => match[1]))];
}
