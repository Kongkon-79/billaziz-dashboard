export type JobCategory = "Full Time" | "Part Time" | "Remote";

export type JobExperienceLevel =
  | "Entry Level"
  | "Mid Level"
  | "Senior Level"
  | "Lead"
  | "Executive";

export type JobStatus = "Active" | "Closed" | "Draft";

export interface JobItem {
  _id: string;
  title: string;
  description: string;
  category?: JobCategory | string;
  location?: string;
  requiredSkills?: string[];
  vacancy?: number;
  companyName?: string;
  salaryRange?: string;
  experienceLevel?: JobExperienceLevel | string;
  applicationDeadline?: string;
  benefits?: string[];
  responsibilities?: string;
  qualifications?: string;
  status: JobStatus | string;
  postedBy?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface JobsMeta {
  page: number;
  limit: number;
  total: number;
}

export interface JobsListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  meta: JobsMeta;
  data: JobItem[];
}

export interface JobMutationResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: JobItem;
}

export interface JobDetailResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: JobItem;
}

export interface JobFormValues {
  title: string;
  description: string;
  category: JobCategory;
  location: string;
  requiredSkills: string;
  vacancy: number;
  companyName: string;
  salaryRange: string;
  experienceLevel: JobExperienceLevel;
  applicationDeadline: string;
  benefits: string;
  responsibilities: string;
  qualifications: string;
  status: JobStatus;
}
