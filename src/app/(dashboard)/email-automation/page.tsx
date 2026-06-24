import React from 'react'
import EmailAutomationContainer from './_components/email-automation-container'
import DashboardOverviewHeader from '../_components/dashboard-overview-header'

const EmailAutomationPage = () => {
  return (
    <div>
        <DashboardOverviewHeader
        title="Email Automation"
        description="Email Automation here"
      />
        <EmailAutomationContainer/>
    </div>
  )
}

export default EmailAutomationPage