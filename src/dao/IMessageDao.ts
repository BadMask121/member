import { Message, MessageDTO } from "../entities/Message";

export interface IMessageDao {
  transaction?: FirebaseFirestore.Transaction;

  getAllChatMessages(chatId: string, filter?: { from?: string; to?: string }): Promise<Message[]>;

  create(message: MessageDTO): Promise<Message>;

  similaritySearch(chatId: string, vectorValue: number[]): Promise<Message[]>;

  delete(id: string): Promise<void>;
}
