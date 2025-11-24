import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AgentModule } from './agent';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule, JwtAuthGuard } from './auth';
import { PrismaModule } from './libs/prisma';
import { QueueModule } from './libs/queue';
import { StorageModule } from './libs/storage/storage.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ProfileModule } from './profile';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    QueueModule,
    StorageModule,
    AuthModule,
    ProfileModule,
    AgentModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
