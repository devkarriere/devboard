import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskLog, TaskLogDocument } from './schemas/task-log.schema';

@Injectable()
export class TaskLogService {
  constructor(
    @InjectModel(TaskLog.name) private taskLogModel: Model<TaskLogDocument>,
  ) {}

  // Einen neuen Log-Eintrag erstellen
  async log(taskId: string, boardId: string, userId: string, message: string) {
    const entry = new this.taskLogModel({ taskId, boardId, userId, message });
    return entry.save();
  }

  // Alle Logs für eine bestimmte Task laden (neueste zuerst)
  async findByTaskId(taskId: string) {
    return this.taskLogModel
      .find({ taskId })
      .sort({ createdAt: -1 })
      .exec();
  }
}
