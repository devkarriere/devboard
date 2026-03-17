import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardsModule } from './boards/boards.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // .env-Datei laden
    ConfigModule.forRoot({ isGlobal: true }),

    // MongoDB-Verbindung über die URI aus der .env-Datei
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/kanban'),

    AuthModule,
    BoardsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
