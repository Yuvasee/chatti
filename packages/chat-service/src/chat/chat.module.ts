import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { MessageService } from './message.service';
import { ChatGateway } from './chat.gateway';
import { Chat, ChatSchema } from '../schemas/chat.schema';
import { Message, MessageSchema } from '../schemas/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  providers: [ChatService, MessageService, ChatGateway],
  exports: [ChatService, MessageService],
})
export class ChatModule {}
