import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/webSockets';
import { Socket } from 'socket.io';
import { MessageEntity } from './message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

class WebSocketPayload {
  sender: string;
  receiver: string;
  content: string;
}

const RABBITMQ_SERVICE = process.env.RABBITMQ_SERVICE || 'RABBITMQ_SERVICE';

@Injectable()
@WebSocketGateway()
export class MessageService
  implements OnGatewayConnection, OnGatewayDisconnect
{
  // @WebSocketServer() server: Server;
  private webSocketClientsMap: Map<string, Socket> = new Map(); // Map to store webSocket client connections by user ID

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @Inject(RABBITMQ_SERVICE)
    private rabbitmqClient: ClientProxy,
  ) {}

  // Track connections
  handleConnection(webSocketClient: Socket) {
    const userId = webSocketClient.handshake.query.userId as string; // Assume userId is passed as query param

    if (userId) {
      this.webSocketClientsMap.set(userId, webSocketClient); // Store the socket associated with the userId
      console.log(`User connected through webSockets: ${userId}`);
    }
  }

  // Track disconnections
  handleDisconnect(webSocketClient: Socket) {
    // Find userId based on socket id and remove from map
    this.webSocketClientsMap.forEach((socket, userId) => {
      if (socket.id === webSocketClient.id) {
        this.webSocketClientsMap.delete(userId);
        console.log(`User disconnected: ${userId}`);
      }
    });
  }

  // Handle incoming WebSocket messages
  @SubscribeMessage('message')
  async handleIncomingWebSocketMessage(
    client: Socket,
    payload: WebSocketPayload,
  ) {
    console.log(
      `Received webSocket message from user ${payload.sender} to user ${payload.receiver}: ${payload.content}`,
    );

    // Add message to RabbitMQ queue
    // await this.rabbitmqClient.emit(process.env.RABBITMQ_MESSAGE_QUEUE, payload);
    console.log('Message added to RabbitMQ queue');

    // Optionally, send a response back to the client
    client.emit('message', { status: 'Message added to queue' });
  }

  // // Send the message to the RabbitMQ queue
  // async sendMessage(content: string, sender: string) {
  //   const message = { content, sender, timestamp: new Date() };
  //   await this.rabbitmqClient.emit(process.env.RABBITMQ_MESSAGE_QUEUE, message);
  // }

  // Emit message to a specific user based on userId
  // sendMessageToUser(userId: string, message: any) {
  //   const webSocketClient = this.webSocketClientsMap.get(userId);

  //   if (webSocketClient) {
  //     webSocketClient.emit('message', message); // Send message to this specific webSocket client
  //   } else {
  //     console.log(`User with id ${userId} not connected`);
  //   }
  // }

  @MessagePattern(process.env.RABBITMQ_MESSAGE_QUEUE)
  async handleMessageInRabbitMQ(@Payload() payload: WebSocketPayload) {
    console.log(
      `Received message in RabbitMQ queue named "${process.env.RABBITMQ_MESSAGE_QUEUE}":`,
      payload,
    );

    // After processing the message, emit it to the appropriate WebSocket client
    // this.server.emit('message', message); // Send message to the frontend via WebSocket

    const webSocketClient = this.webSocketClientsMap.get(payload.receiver);

    if (webSocketClient) {
      webSocketClient.emit('message', payload); // Send message to this specific webSocket client
    } else {
      console.log(
        `User with id ${payload.receiver} not connected to WebSockets`,
      );
    }
  }

  async create(messageData: Partial<MessageEntity>): Promise<MessageEntity> {
    const message = this.messageRepository.create(messageData);
    return this.messageRepository.save(message);
  }

  async findByConversation(conversationId: string): Promise<MessageEntity[]> {
    return this.messageRepository.find({
      where: { conversation: { id: conversationId } },
    });
  }
}
