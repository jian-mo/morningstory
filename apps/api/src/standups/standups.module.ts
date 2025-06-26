import { Module } from '@nestjs/common';
import { StandupsService } from './standups.service';
import { StandupsController } from './standups.controller';
import { StandupGenerationService } from './services/generation.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [IntegrationsModule, UsersModule],
  providers: [StandupsService, StandupGenerationService],
  controllers: [StandupsController],
  exports: [StandupsService, StandupGenerationService],
})
export class StandupsModule {}