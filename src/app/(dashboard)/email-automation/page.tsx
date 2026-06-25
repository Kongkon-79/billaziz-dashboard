import DashboardOverviewHeader from "../_components/dashboard-overview-header";
import EmailAutomationContainer from "./_components/email-automation-container";

const EmailAutomationPage = () => {
  return (
    <div>
      <DashboardOverviewHeader
        title="Email Logs"
        description="Review email delivery activity, failures, and rendered message details."
      />
      <EmailAutomationContainer />
    </div>
  );
};

export default EmailAutomationPage;
