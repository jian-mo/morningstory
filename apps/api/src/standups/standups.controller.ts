import { Controller, Get, Post, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StandupsService } from './standups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('standups')
@Controller('standups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StandupsController {
  constructor(private readonly standupsService: StandupsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user standups' })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async findAll(
    @Request() req: any,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.standupsService.findAll(
      req.user.id,
      take ? parseInt(take, 10) : 10,
      skip ? parseInt(skip, 10) : 0,
    );
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s standup' })
  async findToday(@Request() req: any) {
    return this.standupsService.findByDate(req.user.id, new Date());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific standup' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.standupsService.findOne(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a standup' })
  async remove(@Request() req: any, @Param('id') id: string) {
    await this.standupsService.remove(id, req.user.id);
    return { message: 'Standup deleted successfully' };
  }
}