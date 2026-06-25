export type KnowledgeCategory =
  | "Business Document"
  | "SOP"
  | "Service Description"
  | "FAQ"
  | "Pricing"
  | "Policy"
  | "Other"
  | "Blog";

export type KnowledgeStatus = "active" | "inactive";

export interface KnowledgeItem {
  _id: string;
  title: string;
  category: KnowledgeCategory | string;
  fileUrl?: string;
  filePublicId?: string;
  fileType?: string;
  originalFileName?: string;
  content: string;
  chunks: string[];
  chunkCount: number;
  isTextExtracted: boolean;
  tags: string[];
  status: KnowledgeStatus | string;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface KnowledgeMeta {
  page: number;
  limit: number;
  total: number;
}

export interface KnowledgeListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  meta: KnowledgeMeta;
  data: KnowledgeItem[];
}

export interface KnowledgeDetailResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: KnowledgeItem;
}

export interface KnowledgeMutationResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: KnowledgeItem;
}

export interface KnowledgeFormValues {
  title: string;
  category: KnowledgeCategory;
  content: string;
  tags: string;
  status: KnowledgeStatus;
}
