import { Message } from '../domain/message';

export class MessageService {
  processMessage(rawMessage: string): Message {
    return new Message(rawMessage.toUpperCase());
  }
}
