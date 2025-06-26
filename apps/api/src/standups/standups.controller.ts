import { Controller, Get, Post, Delete, Param, Query, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StandupsService } from './standups.service';
import { StandupGenerationService } from './services/generation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateStandupDto } from './dto/generate-standup.dto';

@ApiTags('standups')
@Controller('standups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StandupsController {
  constructor(
    private readonly standupsService: StandupsService,
    private readonly generationService: StandupGenerationService,
  ) {}

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

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new standup' })
  async generate(@Request() req: any, @Body() generateDto: GenerateStandupDto) {
    const date = generateDto.date ? new Date(generateDto.date) : new Date();
    return this.generationService.generateDailyStandup(req.user.id, date);
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerate an existing standup with new preferences' })
  async regenerate(
    @Request() req: any,
    @Param('id') id: string,
    @Body() generateDto: GenerateStandupDto,
  ) {
    const preferences = {
      tone: generateDto.tone || 'professional',
      length: generateDto.length || 'medium',
      customPrompt: generateDto.customPrompt,
    };
    return this.generationService.regenerateStandup(req.user.id, id, preferences);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a standup' })
  async remove(@Request() req: any, @Param('id') id: string) {
    await this.standupsService.remove(id, req.user.id);
    return { message: 'Standup deleted successfully' };
  }
}