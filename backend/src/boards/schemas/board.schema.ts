import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Eingebettetes Sub-Dokument für eine Task
@Schema({ _id: false })
export class TaskItem {
  @Prop({ type: String, default: () => new Types.ObjectId().toString() })
  id: string;

  @Prop({ required: true })
  columnId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  assignedTo: string;

  @Prop({ required: true })
  order: number;
}

// Eingebettetes Sub-Dokument für eine Spalte
@Schema({ _id: false })
export class ColumnItem {
  @Prop({ type: String, default: () => new Types.ObjectId().toString() })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  order: number;
}

// Haupt-Schema: Ein Board enthält Spalten und Tasks als eingebettete Arrays
@Schema({ timestamps: true })
export class Board {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  ownerId: string; // Supabase User-ID

  @Prop({ type: [ColumnItem], default: [] })
  columns: ColumnItem[];

  @Prop({ type: [TaskItem], default: [] })
  tasks: TaskItem[];
}

export type BoardDocument = Board & Document;
export const BoardSchema = SchemaFactory.createForClass(Board);
