export type EmailLogStatus = "sent" | "failed";

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
