export interface DashboardData {
  totalLeads: number;
  totalConversion: number;
  totalEmailSent: number;
}

export interface DashboardOverviewsApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: DashboardData;
}
