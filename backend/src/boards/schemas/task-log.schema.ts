import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Eigene Collection für Task-Änderungen (Activity Log)
@Schema({ timestamps: true })
export class TaskLog {
  @Prop({ required: true })
  taskId: string;

  @Prop({ required: true })
  boardId: string;

  @Prop({ required: true })
  userId: string; // Wer hat die Änderung gemacht?

  @Prop({ required: true })
  message: string; // z.B. "Status wurde von 'To Do' nach 'In Progress' geändert"
}

export type TaskLogDocument = TaskLog & Document;
export const TaskLogSchema = SchemaFactory.createForClass(TaskLog);
