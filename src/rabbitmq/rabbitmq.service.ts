import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { connect, Connection, Channel, ConsumeMessage } from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: Connection;
  private channel: Channel;
  private readonly queue = 'messages_queue';

  async onModuleInit() {
    this.connection = await connect(process.env.RABBITMQ_URL); // Update with your RabbitMQ URL
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queue, { durable: true });
  }

  async onModuleDestroy() {
    await this.channel.close();
    await this.connection.close();
  }

  async sendToQueue(message: any) {
    const msgBuffer = Buffer.from(JSON.stringify(message));
    this.channel.sendToQueue(this.queue, msgBuffer, { persistent: true });
  }

  async consumeFromQueue(handler: (msg: any) => void) {
    await this.channel.consume(this.queue, (msg: ConsumeMessage | null) => {
      if (msg) {
        const content = msg.content.toString();
        const parsed = JSON.parse(content);
        handler(parsed);
        this.channel.ack(msg);
      }
    });
  }
}
