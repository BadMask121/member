import { MediaMessage, Message } from "../entities/AI";

export interface IAiService {
  embedding(value: string): Promise<number[]>;

  embeddings(value: string): Promise<Array<{ embedding: number[]; content: string }>>;

  callWithRetry(messages: Array<Message | MediaMessage>, retries?: number): Promise<string | null>;
}
