import { Message, MessageDTO } from "../entities/Message";

export interface IMessageDao {
  transaction?: FirebaseFirestore.Transaction;

  getAllChatMessages(chatId: string, filter?: { from: number; to: number }): Promise<Message[]>;

  add(messages: MessageDTO[]): Promise<void>;

  similaritySearch(chatId: string, vectorValue: number[]): Promise<Message[]>;

  delete(id: string): Promise<void>;
}
