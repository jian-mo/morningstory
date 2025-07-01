import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { integrationsApi } from '../lib/api'
import { IntegrationCard } from '../components/integrations/IntegrationCard'
import { AddIntegrationCard } from '../components/integrations/AddIntegrationCard'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Settings, Zap, ArrowLeft } from 'lucide-react'

const AVAILABLE_INTEGRATIONS = [
  {
    type: 'GITHUB',
    description: 'Connect your GitHub account to fetch commits, pull requests, and issues for your standups.',
    isImplemented: true,
  },
  {
    type: 'JIRA',
    description: 'Import your Jira tickets and track your progress across sprints.',
    isImplemented: false,
  },
  {
    type: 'ASANA',
    description: 'Sync your Asana tasks and projects to generate comprehensive standups.',
    isImplemented: false,
  },
  {
    type: 'TRELLO',
    description: 'Pull your Trello cards and board activity into your daily updates.',
    isImplemented: false,
  },
  {
    type: 'GITLAB',
    description: 'Connect GitLab to track your merge requests and pipeline activity.',
    isImplemented: false,
  },
  {
    type: 'SLACK',
    description: 'Integrate with Slack to automatically share your generated standups.',
    isImplemented: false,
  },
]

export function Integrations() {
  const { data: integrations = [], isLoading, error } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsApi.list().then((res) => res.data),
  })

  const connectedTypes = new Set(integrations.map(i => i.type))
  const availableIntegrations = AVAILABLE_INTEGRATIONS.filter(i => !connectedTypes.has(i.type as any))

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div role="status" className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" aria-label="Loading integrations"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error loading integrations</h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
                <p className="text-gray-600">Connect your favorite tools to generate better standups</p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="default" className="text-sm">
              {integrations.length} Connected
            </Badge>
            <Badge variant="outline" className="text-sm">
              {availableIntegrations.filter(i => i.isImplemented).length} Available
            </Badge>
          </div>
        </div>

        {/* Connected Integrations */}
        {integrations.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center space-x-2 mb-6">
              <Zap className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Connected Platforms</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </div>
        )}

        {/* Available Integrations */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {integrations.length > 0 ? 'Add More Platforms' : 'Connect Your First Platform'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableIntegrations.map((integration) => (
              <AddIntegrationCard
                key={integration.type}
                type={integration.type}
                description={integration.description}
                isImplemented={integration.isImplemented}
              />
            ))}
          </div>
        </div>

        {/* Help Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Integrations are used to fetch your recent activity for standup generation</p>
              <p>• Your credentials are encrypted and stored securely</p>
              <p>• You can disconnect any integration at any time</p>
              <p>• More platforms are coming soon - let us know what you need!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}