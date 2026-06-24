export type EmailLogStatus = "sent" | "failed";

export interface EmailTemplateItem {
  _id: string;
  key: string;
  name: string;
  subject: string;
  htmlBody: string;
  description?: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface EmailTemplateListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: EmailTemplateItem[];
}

export interface EmailTemplateMutationResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: EmailTemplateItem;
}

export interface EmailLogItem {
  _id: string;
  to: string;
  subject: string;
  templateKey?: string;
  status: EmailLogStatus | string;
  htmlBody: string;
  error?: string;
  relatedLead?: string;
  orderId?: string;
  description?: string;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface EmailLogMeta {
  page: number;
  limit: number;
  total: number;
}

export interface EmailLogListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  meta: EmailLogMeta;
  data: EmailLogItem[];
}

export interface EmailLogDetailResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: EmailLogItem;
}

export interface SendEmailResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    sent: boolean;
    reason?: string;
  };
}

export interface EmailTemplateFormValues {
  key: string;
  name: string;
  subject: string;
  htmlBody: string;
  description: string;
  variables: string;
  isActive: boolean;
}

export interface SendEmailFormValues {
  to: string;
  templateKey: string;
  variables: string;
  leadId: string;
  description: string;
  orderId: string;
}
