import { Controller } from '@nestjs/common';
import { MessageService } from './message.service';

// class SendMessageDto {
//   content: string;
//   sender: string;
// }

@Controller('sendMessage')
export class MessageController {
  constructor(private readonly messagesService: MessageService) {}

  // @Post()
  // async sendMessage(@Body() sendMessageDto: SendMessageDto) {
  //   await this.messagesService.sendMessage(
  //     sendMessageDto.content,
  //     sendMessageDto.sender,
  //   );
  //   return { status: 'Message sent to queue' };
  // }
}
