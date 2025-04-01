import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { ChatModule } from './chat/chat.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [DatabaseModule, ChatModule, QueueModule],
  controllers: [AppController],
})
export class AppModule {}
