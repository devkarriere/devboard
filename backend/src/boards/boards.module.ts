import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { TaskLogService } from './task-log.service';
import { Board, BoardSchema } from './schemas/board.schema';
import { TaskLog, TaskLogSchema } from './schemas/task-log.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    // Board- und TaskLog-Schema für dieses Modul registrieren
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: TaskLog.name, schema: TaskLogSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [BoardsController],
  providers: [BoardsService, TaskLogService],
})
export class BoardsModule {}
