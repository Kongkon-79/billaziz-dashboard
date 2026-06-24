export type AppliedJobStatus =
  | "Pending"
  | "Reviewed"
  | "Selected"
  | "Rejected";

export interface AppliedJobItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  interestedPosition: string;
  tellUsYourself: string;
  status: AppliedJobStatus | string;
  jobId?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface AppliedJobMeta {
  page: number;
  limit: number;
  total: number;
}

export interface AppliedJobListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  meta: AppliedJobMeta;
  data: AppliedJobItem[];
}

export interface AppliedJobMutationResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: AppliedJobItem;
}

export interface AppliedJobDetailResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: AppliedJobItem;
}

export interface AppliedJobFormValues {
  name: string;
  email: string;
  phone: string;
  interestedPosition: string;
  tellUsYourself: string;
}

export interface AppliedJobStatusFormValues {
  status: AppliedJobStatus;
  customMessage?: string;
}
