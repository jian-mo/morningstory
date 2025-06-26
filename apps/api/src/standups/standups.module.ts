import { Module } from '@nestjs/common';
import { StandupsService } from './standups.service';
import { StandupsController } from './standups.controller';

@Module({
  providers: [StandupsService],
  controllers: [StandupsController],
  exports: [StandupsService],
})
export class StandupsModule {}