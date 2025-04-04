import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TranslationDocument = Translation & Document;

@Schema({ timestamps: true })
export class Translation {
  @Prop({ required: true, index: true })
  messageId!: string;

  @Prop({ required: true })
  originalText!: string;

  @Prop({ required: true })
  translatedText!: string;

  @Prop({ required: true })
  sourceLanguage!: string;

  @Prop({ required: true })
  targetLanguage!: string;
}

export const TranslationSchema = SchemaFactory.createForClass(Translation);

// Create compound index for messageId and targetLanguage
TranslationSchema.index({ messageId: 1, targetLanguage: 1 }, { unique: true }); 