import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ParticipantService } from 'src/participant/participant.service';
import { MessageEntity } from './message.entity';
import { MessageService } from './message.service';
import { ParticipantEntity } from 'src/participant/participant.entity';

@WebSocketGateway({ cors: true }) // Enable CORS if needed
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private webSocketClientsMap = new Map<string, Set<string>>();

  constructor(
    private readonly participantService: ParticipantService,
    private readonly messageService: MessageService,

    // @InjectRepository(ParticipantEntity)
    // private readonly participantRepository: Repository<ParticipantEntity>,
  ) {}

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

  //private webSocketClientsMap: Map<string, Socket> = new Map(); // Map to store webSocket client connections by user ID

  // Track connections
  //   handleConnection(webSocketClient: Socket) {
  //     const userId = webSocketClient.handshake.query.userId as string; // Assume userId is passed as query param

  //     if (userId) {
  //       this.webSocketClientsMap.set(userId, webSocketClient); // Store the socket associated with the userId
  //       console.log(`User connected through webSockets: ${userId}`);
  //     }
  //   }

  //   // Track disconnections
  //   handleDisconnect(webSocketClient: Socket) {
  //     // Find userId based on socket id and remove from map
  //     this.webSocketClientsMap.forEach((socket, userId) => {
  //       if (socket.id === webSocketClient.id) {
  //         this.webSocketClientsMap.delete(userId);
  //         console.log(`User disconnected: ${userId}`);
  //       }
  //     });
  //   }

  //   // Handle incoming WebSocket messages
  //   @SubscribeMessage('message')
  //   async handleIncomingWebSocketMessage(
  //     client: Socket,
  //     payload: WebSocketPayload,
  //   ) {
  //     console.log(
  //       `Received webSocket message from user ${payload.sender} to user ${payload.receiver}: ${payload.content}`,
  //     );

  //     // Add message to RabbitMQ queue
  //     // await this.rabbitmqClient.emit(process.env.RABBITMQ_MESSAGE_QUEUE, payload);
  //     console.log('Message added to RabbitMQ queue');

  //     // Optionally, send a response back to the client
  //     client.emit('message', { status: 'Message added to queue' });
  //   }

  // Triggered when a client connects
  //   handleConnection(client: Socket) {
  //     console.log(`Client connected: ${client.id}`);
  //   }

  //   // Triggered when a client disconnects
  //   handleDisconnect(client: Socket) {
  //     console.log(`Client disconnected: ${client.id}`);
  //   }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: Socket, messageData: Partial<MessageEntity>) {
    try {
      console.log(
        `Message received: ${messageData.content} from ${messageData.senderId}.
        ${JSON.stringify(messageData)}`,
      );

      // Save the message to the database
      const message = await this.messageService.create(messageData);

      // Notify participants about the new message
      const participants = await this.participantService.findByConversation(
        message.conversation.id,
      );

      console.log(
        'Participants in this conversation',
        JSON.stringify(participants),
      );

      //   participants.forEach((participant: ParticipantEntity) => {
      //     if (participant.userId !== messageData.senderId) {
      //       this.server.to(participant.userId).emit('newMessageNotification', {
      //         conversationId: message.conversation.id,
      //         message,
      //       });

      //       this.server.to(participant.userId).emit('receiveMessage', {
      //         conversationId: message.conversation.id,
      //         message,
      //       });
      //     }
      //   });

      participants.forEach((participant: ParticipantEntity) => {
        if (participant.userId !== messageData.senderId) {
          const clientIds = this.webSocketClientsMap.get(participant.userId);

          if (clientIds) {
            // Emit to all clients of the participant
            clientIds.forEach((clientId) => {
              this.server.to(clientId).emit('newMessageNotification', message);

              this.server.to(clientId).emit('receiveMessage', message);
            });
          }
        }
      });
      client.emit('messageSent', { success: true, message });
    } catch (error: unknown) {
      client.emit('messageSent', {
        success: false,
        message: messageData,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      console.error(
        'Error in sending WebSocket message:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  // Handle incoming messages from clients
  //   @SubscribeMessage('sendMessage')
  //   handleMessage(
  //     client: Socket,
  //     payload: { conversationId: string; message: string; senderId: string },
  //   ) {
  //     console.log(
  //       `Message received: ${payload.message} from ${payload.senderId}`,
  //     );

  //     // Emit the message to all clients in the same conversation room
  //     this.server.to(payload.conversationId).emit('receiveMessage', payload);
  //   }

  // Join a conversation room
  //   @SubscribeMessage('joinRoom')
  //   handleJoinRoom(client: Socket, room: string) {
  //     client.join(room);
  //     console.log(`Client ${client.id} joined room: ${room}`);
  //   }
}
