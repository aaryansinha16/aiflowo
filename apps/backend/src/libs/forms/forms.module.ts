import { Module } from '@nestjs/common';

import { LLMModule } from '../../agent';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';

import { FieldMapperService } from './field-mapper.service';
import { FormProfileController } from './form-profile.controller';
import { FormProfileService } from './form-profile.service';
import { FormsController } from './forms.controller';
import { SessionService } from './session.service';

@Module({
  imports: [LLMModule, QueueModule, PrismaModule],
  controllers: [FormsController, FormProfileController],
  providers: [FieldMapperService, SessionService, FormProfileService],
  exports: [FieldMapperService, SessionService, FormProfileService],
})
export class FormsModule {}
