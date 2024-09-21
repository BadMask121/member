import { Message, MessageDTO } from "../entities/Message";

export interface IMessageDao {
  transaction?: FirebaseFirestore.Transaction;

  get(id: string): Promise<Message | null>;

  getAllChatMessages(chatId: string, filter?: { from?: string; to?: string }): Promise<Message[]>;

  create(message: MessageDTO): Promise<Message>;

  delete(id: string): Promise<void>;
}
