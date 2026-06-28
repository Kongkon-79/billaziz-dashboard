import React from 'react'
import AiConversationContainer from './_components/ai-conversation-container'
import DashboardOverviewHeader from '../_components/dashboard-overview-header'

const AiConversationPage = () => {
  return (
    <div>
          <DashboardOverviewHeader
        title="AI Conversation History"
        description="Select a chat user and inspect the full customer and assistant conversation."
      />
        <AiConversationContainer/>
    </div>
  )
}

export default AiConversationPage