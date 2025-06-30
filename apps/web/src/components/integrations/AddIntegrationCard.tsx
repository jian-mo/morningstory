import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { getIntegrationIcon, getIntegrationName } from '../../lib/utils'
import { Plus } from 'lucide-react'

interface AddIntegrationCardProps {
  type: string
  description: string
  isImplemented?: boolean
}

export function AddIntegrationCard({ type, description, isImplemented = false }: AddIntegrationCardProps) {
  const handleConnect = () => {
    if (type === 'GITHUB') {
      window.location.href = '/connect-github'
    } else {
      alert(`${getIntegrationName(type)} integration coming soon!`)
    }
  }

  return (
    <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl opacity-60">{getIntegrationIcon(type)}</span>
          <div>
            <CardTitle className="text-lg">{getIntegrationName(type)}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={isImplemented ? 'default' : 'outline'}>
                {isImplemented ? 'Available' : 'Coming Soon'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <Button
          onClick={handleConnect}
          disabled={!isImplemented}
          variant={isImplemented ? 'default' : 'outline'}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isImplemented ? 'Connect' : 'Coming Soon'}
        </Button>
      </CardContent>
    </Card>
  )
}