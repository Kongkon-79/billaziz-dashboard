export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal Sent"
  | "Closed Won"
  | "Closed Lost";

export type LeadSource = "Website Form" | "Chatbot" | "Manual Entry";

export interface LeadNote {
  _id?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeadItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  itemType?: string;
  urgency?: string;
  formNotes?: string;
  serviceNeeded?: string;
  inquiryType?: string;
  message?: string;
  zipCode?: string;
  dropZipCode?: string;
  source?: string;
  status: LeadStatus | string;
  notes?: LeadNote[];
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface LeadMeta {
  page: number;
  limit: number;
  total: number;
}

export interface LeadListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  meta: LeadMeta;
  data: LeadItem[];
}

export interface LeadMutationResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: LeadItem;
}
