import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ParticipantService } from 'src/participant/participant.service';
import { MessageEntity, MessageStatus } from './message.entity';
import { MessageService } from './message.service';
import { ParticipantEntity } from 'src/participant/participant.entity';
import { ConversationEntity } from 'src/conversation/conversation.entity';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_MESSAGE_QUEUE, RABBITMQ_SERVICE } from 'src/contants';

@Injectable()
@WebSocketGateway({ cors: true })
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private webSocketClientsMap = new Map<string, Set<string>>();

  constructor(
    @Inject(RABBITMQ_SERVICE)
    private rabbitmqClient: ClientProxy,
    @Inject(ParticipantService)
    private readonly participantService: ParticipantService,
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
  ) {}

  getWebSocketClientsMap() {
    return this.webSocketClientsMap;
  }

  handleConnection(client: Socket) {
    const userIdQueryParam = client.handshake.query.userId;
    const userId = Array.isArray(userIdQueryParam)
      ? userIdQueryParam[0]
      : userIdQueryParam;

    if (!userId) {
      console.error('No userId found in handshake query');
      return;
    }

    if (!this.webSocketClientsMap.has(userId)) {
      this.webSocketClientsMap.set(userId, new Set());
    }
    this.webSocketClientsMap.get(userId).add(client.id);

    console.log('WebSocket connection established with user', userId);
  }

  handleDisconnect(client: Socket) {
    const userIdQueryParam = client.handshake.query.userId;
    const userId = Array.isArray(userIdQueryParam)
      ? userIdQueryParam[0]
      : userIdQueryParam;

    if (!userId) {
      console.error('No userId found in handshake query');
      return;
    }

    this.webSocketClientsMap.get(userId)?.delete(client.id);

    if (this.webSocketClientsMap.get(userId)?.size === 0) {
      this.webSocketClientsMap.delete(userId);
    }

    console.log('WebSocket connection removed for user', userId);
  }

  async sendMessageToRabbitMQ(messageData: Partial<MessageEntity>) {
    try {
      console.log(
        `Sending message to RabbitMQ queue '${RABBITMQ_MESSAGE_QUEUE}':`,
        messageData,
      );

      await new Promise((resolve, reject) => {
        this.rabbitmqClient
          .emit(RABBITMQ_MESSAGE_QUEUE, messageData)
          .subscribe({
            next: () => resolve(true),
            error: (err) => reject(err),
          });
      });
    } catch (error: unknown) {
      console.error(
        'Error sending message to RabbitMQ:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: Socket, messageData: Partial<MessageEntity>) {
    try {
      await this.sendMessageToRabbitMQ(messageData);
    } catch (error: unknown) {
      client.emit('messageStatusUpdate', {
        status: MessageStatus.FAILED,
        message: messageData,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error(
        'Error in sending WebSocket message:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  async handleMessageFromRabbitMQ(messageData: Partial<MessageEntity>) {
    const clientIds = this.webSocketClientsMap.get(messageData.senderId);

    try {
      // throw new Error('Fake error');

      console.log(
        `Message received: ${messageData.content} from ${messageData.senderId}.
        ${JSON.stringify(messageData)}`,
      );

      // Save the message to the database
      const message = await this.messageService.create(messageData);

      // client.emit('messageStatusUpdate', {
      //   status: MessageStatus.SENT,
      //   message,
      // });

      clientIds.forEach((clientId) => {
        this.server.to(clientId).emit('messageStatusUpdate', {
          status: MessageStatus.SENT,
          message,
        });
      });

      // Notify participants about the new message
      const participants = await this.participantService.findByConversation(
        message.conversation.id,
      );

      console.log(
        'Participants in this conversation',
        JSON.stringify(participants),
      );

      let hasDeliveredMessage = false;

      participants.forEach((participant: ParticipantEntity) => {
        if (participant.userId !== messageData.senderId) {
          const clientIds = this.webSocketClientsMap.get(participant.userId);

          if (clientIds) {
            // Emit to all clients of the participant
            clientIds.forEach((clientId) => {
              this.server.to(clientId).emit('newMessageNotification', message);

              this.server.to(clientId).emit('receiveMessage', message);
            });

            hasDeliveredMessage = true;
          }
        }
      });

      if (hasDeliveredMessage) {
        await this.messageService.updateMessageStatus(
          message.id,
          MessageStatus.DELIVERED,
        );

        // Pause for 2 seconds for effect
        // await new Promise((resolve) => setTimeout(resolve, 2000));

        // client.emit('messageStatusUpdate', {
        //   status: MessageStatus.DELIVERED,
        //   message,
        // });

        clientIds.forEach((clientId) => {
          this.server.to(clientId).emit('messageStatusUpdate', {
            status: MessageStatus.DELIVERED,
            message,
          });
        });
      }
    } catch (error: unknown) {
      // client.emit('messageStatusUpdate', {
      //   status: MessageStatus.FAILED,
      //   message: messageData,
      //   error: error instanceof Error ? error.message : 'Unknown error',
      // });

      clientIds.forEach((clientId) => {
        this.server.to(clientId).emit('messageStatusUpdate', {
          status: MessageStatus.FAILED,
          message: messageData,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });

      console.error(
        'Error in sending WebSocket message:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  @SubscribeMessage('statusUpdate')
  async handleStatusUpdate(
    client: Socket,
    messageDataObj: {
      conversation: Partial<ConversationEntity>;
      message: Partial<MessageEntity>;
      newStatus: MessageStatus;
    },
  ) {
    try {
      console.log(
        `Message status update received: ${messageDataObj.message.content} from ${messageDataObj.message.senderId}.
        ${JSON.stringify(messageDataObj)}`,
      );

      await this.messageService.updateMessageStatus(
        messageDataObj.message.id,
        messageDataObj.newStatus,
      );

      messageDataObj.conversation.participants.forEach(
        (participant: ParticipantEntity) => {
          if (participant.userId === messageDataObj.message.senderId) {
            const clientIds = this.webSocketClientsMap.get(participant.userId);

            if (clientIds) {
              // Emit to all clients of the participant
              clientIds.forEach((clientId) => {
                this.server.to(clientId).emit('messageStatusUpdate', {
                  status: MessageStatus.READ,
                  message: messageDataObj.message,
                });
              });
            }
          }
        },
      );
    } catch (error: unknown) {
      console.error(
        'Error saving message status update:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  // Join a conversation room
  //   @SubscribeMessage('joinRoom')
  //   handleJoinRoom(client: Socket, room: string) {
  //     client.join(room);
  //     console.log(`Client ${client.id} joined room: ${room}`);
  //   }
}
