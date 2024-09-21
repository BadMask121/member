import { BotClient, BotClientDTO } from "../entities/BotClient";

export type BotClientEvent = "added" | "removed";
export interface IBotClientDao {
  transaction?: FirebaseFirestore.Transaction;

  getByPhone(phoneNumber: string): Promise<BotClient | null>;

  getAll(): Promise<BotClient[]>;

  save(botClientDto: Partial<BotClientDTO>, id?: string): Promise<Partial<BotClient>>;

  delete(id: string): Promise<void>;

  on(event: BotClientEvent, callback: <T>(data: T) => Promise<void>): void;
}
