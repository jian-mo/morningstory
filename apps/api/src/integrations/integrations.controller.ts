import { Controller, Get, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntegrationType } from '@prisma/client';

@ApiTags('integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user integrations' })
  async findAll(@Request() req: any) {
    return this.integrationsService.findAll(req.user.id);
  }

  @Delete(':type')
  @ApiOperation({ summary: 'Remove an integration' })
  async remove(@Request() req: any, @Param('type') type: IntegrationType) {
    await this.integrationsService.remove(req.user.id, type);
    return { message: `${type} integration removed successfully` };
  }
}