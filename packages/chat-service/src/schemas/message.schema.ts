import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  chatId!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  username!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: Object, default: {} })
  translations!: Record<string, string>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
