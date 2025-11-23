import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { BrowserProcessor } from './processors/browser.processor';
import { EmailProcessor } from './processors/email.processor';
import { MediaProcessor } from './processors/media.processor';
import { TaskProcessor } from './processors/task.processor';
import { QueueName } from './queue.constants';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', '127.0.0.1'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    // Register all queues
    BullModule.registerQueue(
      { name: QueueName.TASK },
      { name: QueueName.BROWSER },
      { name: QueueName.EMAIL },
      { name: QueueName.MEDIA },
    ),
  ],
  providers: [
    QueueService,
    TaskProcessor,
    BrowserProcessor,
    MediaProcessor,
    EmailProcessor,
  ],
  controllers: [QueueController],
  exports: [QueueService],
})
export class QueueModule {}
