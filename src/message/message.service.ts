import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class MessageService {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async sendMessage(content: string, sender: string) {
    const message = { content, sender, timestamp: new Date() };
    await this.rabbitMQService.sendToQueue(message);
  }
}
