import { MessageService } from "./service";

export class HandleMessage {
    private messageService: MessageService;
  
    constructor() {
      this.messageService = new MessageService();
    }
  
    async execute(rawMessage: string) {
      const message = this.messageService.processMessage(rawMessage);
      console.log("Processed Message:", message.content);
    }
  }