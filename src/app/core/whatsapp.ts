export interface WhatsAppCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  categoryId: string;
  name: string;
  metaTemplateName: string;
  language: string;
  metaCategory: string;
  body: string;
  footer: string | null;
  providerStatus: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppJobRequest {
  templateId: string;
  phoneAttributeCodes: string[];
  variableMappings: Record<string, string>;
  savedSearchId?: string | null;
  recordType?: string | null;
  q?: string | null;
  filter?: string[];
  customerIds?: string[];
}

export interface WhatsAppPreviewSample {
  customerId: string;
  phone: string;
  body: string;
}

export interface WhatsAppPreview {
  requested: number;
  eligible: number;
  skippedNoPhone: number;
  skippedInvalid: number;
  skippedOptIn: number;
  overCap: boolean;
  maxRecipients: number;
  samples: WhatsAppPreviewSample[];
}

export interface WhatsAppProviderInfo {
  key: string;
  ready: boolean;
  active: boolean;
}

export interface WhatsAppProviderList {
  active: string;
  providers: WhatsAppProviderInfo[];
}

export interface WhatsAppJob {
  id: string;
  status: string;
  audienceKind: string;
  templateName: string;
  providerKey: string;
  providerBatchId: string | null;
  requested: number;
  skippedNoPhone: number;
  skippedInvalid: number;
  skippedOptIn: number;
  submitted: number;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export function whatsAppPlaceholders(template: WhatsAppTemplate | null): string[] {
  if (!template) return [];
  const found = new Set<string>();
  const pattern = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;
  for (const source of [template.body]) {
    for (const match of source.matchAll(pattern)) {
      found.add(match[1]);
    }
  }
  return [...found];
}

export interface ChannelSettings {
  smsBaseUrl: string;
  smsApiKeySet: boolean;
  smsProvider: string;
  emailHost: string;
  emailPort: number;
  emailUsername: string;
  emailPasswordSet: boolean;
  emailFromAddress: string;
  emailFromName: string;
  emailProvider: string;
  whatsAppPhoneNumberId: string;
  whatsAppBusinessAccountId: string;
  whatsAppAccessTokenSet: boolean;
  whatsAppGraphVersion: string;
  whatsAppCountryCode: string;
  whatsAppProvider: string;
}
