import { Module } from '@nestjs/common';
import { SseController } from './sse.controller';
import { SseService } from './sse.service';

@Module({
  controllers: [SseController],
  providers: [SseService],
  exports: [SseService], // Wird von BoardsModule importiert
})
export class NotificationsModule {}
