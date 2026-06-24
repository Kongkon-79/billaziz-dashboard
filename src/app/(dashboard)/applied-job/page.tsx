import React from 'react'
import AppliedJobContainer from './_components/applied-job-container'
import DashboardOverviewHeader from '../_components/dashboard-overview-header'

const AppliedJobPage = () => {
  return (
    <div>
         <DashboardOverviewHeader
        title="Applied Job"
        description="Applied Job here"
      />
        <AppliedJobContainer/>
    </div>
  )
}

export default AppliedJobPage