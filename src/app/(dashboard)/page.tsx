import DashboardOverviewHeader from "./_components/dashboard-overview-header";
import { DashboardOverview } from "./_components/dashboard-overview";
import { LeadAnalytics } from "./_components/lead-analytics";
import { RecentLead } from "./_components/recent-lead";

const DashboardOverviewPage = () => {
  return (
    <div>
      <DashboardOverviewHeader
        title="Dashboard Overview"
        description="Monitor your lead pipeline, conversions, and outreach performance."
      />
      <DashboardOverview />
      <LeadAnalytics />
      <RecentLead />
    </div>
  );
};

export default DashboardOverviewPage;
