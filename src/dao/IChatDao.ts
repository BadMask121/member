import { Chat, ChatDTO } from "../entities/Chat";

export interface IChatDao {
  transaction?: FirebaseFirestore.Transaction;

  get(id: string, filter?: { adminId: string }): Promise<Chat | null>;

  /**
   *
   * TODO: apply pagination
   * @param adminId
   */
  getAllByAdmin(adminId: string): Promise<Chat[]>;

  save(chat: Partial<ChatDTO>, id?: string): Promise<Partial<Chat>>;

  removeMember(memberId: string): Promise<boolean>;

  delete(id: string): Promise<void>;

  softDelete(id: string): Promise<void>;
}
