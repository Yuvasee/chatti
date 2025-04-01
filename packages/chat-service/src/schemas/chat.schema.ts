import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true, unique: true })
  chatId!: string;

  @Prop({ required: true, default: [] })
  participants!: string[];

  @Prop({ default: false })
  isActive!: boolean;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
