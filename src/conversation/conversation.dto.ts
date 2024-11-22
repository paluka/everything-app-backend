export class CreateConversationDto {
  //   name: string;
  participants: { userId: string }[];
  messages: { content: string; senderId: string }[];
}
