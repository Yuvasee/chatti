import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { ChatModule } from './chat/chat.module';
import { QueueModule } from './queue/queue.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule, 
    ChatModule, 
    QueueModule
  ],
  controllers: [AppController],
})
export class AppModule {}
