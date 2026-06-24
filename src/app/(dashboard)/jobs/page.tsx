import React from 'react'
import JobsContainer from './_components/jobs-container'
import DashboardOverviewHeader from '../_components/dashboard-overview-header'

const JobsPage = () => {
  return (
    <div>
         <DashboardOverviewHeader
        title="Jobs"
        description="Jobs here"
      />
        <JobsContainer/>
    </div>
  )
}

export default JobsPage