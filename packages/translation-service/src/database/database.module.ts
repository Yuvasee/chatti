import { Module } from '@nestjs/common';
import { DatabaseModule as SharedDatabaseModule } from '@chatti/shared-types';
import { MongooseModule } from '@nestjs/mongoose';
import { Translation, TranslationSchema } from '../schemas/translation.schema';

@Module({
  imports: [
    SharedDatabaseModule.forRoot(),
    MongooseModule.forFeature([
      { name: Translation.name, schema: TranslationSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
