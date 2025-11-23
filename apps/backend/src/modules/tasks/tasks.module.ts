/**
 * Tasks Module
 * Provides chat and task management functionality
 */

import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AgentModule } from '../../agent/agent.module';
import { PrismaModule } from '../../libs/prisma';
import { QueueModule } from '../../libs/queue';

import { ChatsController } from './chat/chats.controller';
import { ChatsService } from './chat/chats.service';
import { TaskUpdatesService } from './task/sse/task-updates.service';
import { TasksController } from './task/tasks.controller';
import { TasksService } from './task/tasks.service';
import { TaskStateValidator } from './validators/task-state.validator';

@Global()
@Module({
  imports: [
    AgentModule,
    EventEmitterModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [ChatsController, TasksController],
  providers: [
    ChatsService,
    TasksService,
    TaskUpdatesService,
    TaskStateValidator,
    {
      provide: 'TasksService',
      useExisting: TasksService,
    },
  ],
  exports: [ChatsService, TasksService, TaskUpdatesService, 'TasksService'],
})
export class TasksModule {}
