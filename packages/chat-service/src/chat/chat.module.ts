import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { MessageService } from './message.service';
import { ChatGateway } from './chat.gateway';
import { Chat, ChatSchema } from '../schemas/chat.schema';
import { Message, MessageSchema } from '../schemas/message.schema';
import { ChatController } from './chat.controller';
import { QueueModule } from '../queue/queue.module';
import { LoggingModule } from '@chatti/shared-types';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    QueueModule,
    LoggingModule
  ],
  controllers: [ChatController],
  providers: [ChatService, MessageService, ChatGateway],
  exports: [ChatService, MessageService],
})
export class ChatModule {}
