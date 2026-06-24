import React from 'react'
import KnowledgeBaseContainer from './_components/knowledge-base-container'
import DashboardOverviewHeader from '../_components/dashboard-overview-header'

const KnowledgeBasePage = () => {
  return (
    <div>
         <DashboardOverviewHeader
        title="Knowledge Base"
        description="Knowledge Base here"
      />
        <KnowledgeBaseContainer/>
    </div>
  )
}

export default KnowledgeBasePage