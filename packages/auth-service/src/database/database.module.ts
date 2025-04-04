import { Module } from '@nestjs/common';
import { DatabaseModule as SharedDatabaseModule } from '@chatti/shared-types';

@Module({
  imports: [SharedDatabaseModule.forRoot()],
  exports: [SharedDatabaseModule.forRoot()],
})
export class DatabaseModule {} 