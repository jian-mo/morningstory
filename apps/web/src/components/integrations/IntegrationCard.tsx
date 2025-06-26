import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { integrationsApi, Integration } from '../../lib/api'
import { getIntegrationIcon, getIntegrationName } from '../../lib/utils'
import { Trash2, ExternalLink } from 'lucide-react'

interface IntegrationCardProps {
  integration: Integration
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const queryClient = useQueryClient()

  const removeMutation = useMutation({
    mutationFn: () => integrationsApi.remove(integration.type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })

  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to disconnect ${getIntegrationName(integration.type)}?`)) {
      removeMutation.mutate()
    }
  }

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getIntegrationIcon(integration.type)}</span>
            <div>
              <CardTitle className="text-lg">{getIntegrationName(integration.type)}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={integration.isActive ? 'default' : 'secondary'}>
                  {integration.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {integration.lastSyncedAt && (
                  <span className="text-xs text-muted-foreground">
                    Last sync: {new Date(integration.lastSyncedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={removeMutation.isPending}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {integration.metadata?.username && (
            <div className="text-sm">
              <span className="text-muted-foreground">Username: </span>
              <span className="font-medium">{integration.metadata.username}</span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-muted-foreground">Connected: </span>
            <span>{new Date(integration.createdAt).toLocaleDateString()}</span>
          </div>
          {integration.type === 'GITHUB' && integration.metadata?.username && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open(`https://github.com/${integration.metadata?.username}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Profile
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}