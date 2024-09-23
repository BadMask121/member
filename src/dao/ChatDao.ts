import { Firestore } from "@google-cloud/firestore";
import isNil from "lodash.isnil";
import omit from "lodash.omitby";
import { Chat, ChatDTO } from "../entities/Chat";
import { DaoError } from "../errors/dao";
import { IChatDao } from "./IChatDao";
import { DaoTable } from "./IDao";

export class ChatDao implements IChatDao {
  transaction!: FirebaseFirestore.Transaction;

  constructor(
    private readonly db: Firestore,
    private readonly tableName: DaoTable
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeMember(_memberId: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async get(id: string, filter?: { adminId: string }): Promise<Chat | null> {
    try {
      const docRef = this.db.collection(this.tableName).doc(id);
      let chatSnap: FirebaseFirestore.DocumentSnapshot<
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (this.transaction) {
        chatSnap = await this.transaction.get(docRef);
      } else {
        chatSnap = await docRef.get();
      }

      const chat = chatSnap.data() as Chat | null;
      if (!chat) {
        return null;
      }

      if (filter?.adminId) {
        if (chat.adminId !== filter.adminId) {
          return null;
        }
      }

      return {
        ...chat,
        id,
      };
    } catch (error) {
      throw new DaoError({
        name: "ChatDao",
        message: "Unable to retrieve chat",
        id,
        filter,
        error,
      });
    }
  }

  // TODO: apply pagination
  async getAllByAdmin(adminId: string): Promise<Chat[]> {
    try {
      const docRef = this.db
        .collection(this.tableName)
        .where("adminId", "==", adminId)
        .orderBy("createdAt", "desc");

      let chatSnap: FirebaseFirestore.QuerySnapshot<
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (this.transaction) {
        chatSnap = await this.transaction.get(docRef);
      } else {
        chatSnap = await docRef.get();
      }

      const chats = chatSnap.docs;
      if (!chats.length) {
        return [];
      }

      const allChats = chats.map((doc) => {
        const chat = doc.data() as Chat;
        return {
          ...chat,
          id: doc.id,
        };
      });

      return allChats;
    } catch (error) {
      throw new DaoError({
        name: "ChatDao",
        message: "Unable to retrieve chats",
        adminId,
        error,
      });
    }
  }

  async save(chatDto: Partial<ChatDTO>, id?: string): Promise<Partial<Chat>> {
    try {
      const payload = omit<ChatDTO>(chatDto, isNil);
      const collectionRef = this.db.collection(this.tableName);
      let chatRef: FirebaseFirestore.DocumentReference<
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (id) {
        chatRef = collectionRef.doc(id);
      } else {
        chatRef = collectionRef.doc();
      }

      if (this.transaction) {
        this.transaction.set(chatRef, payload, { merge: true });
      } else {
        await chatRef.set(payload, { merge: true });
      }

      return {
        ...chatDto,
        isGroup: chatDto.isGroup || false,
        members: chatDto.members || [],
      };
    } catch (error) {
      throw new DaoError({
        name: "ChatDao",
        message: "Unable to create chat",
        chat: chatDto,
        error,
      });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const data = (await this.db.collection(this.tableName).where("id", "==", id).get()).docs?.[0];
      if (data) {
        await this.db.collection(this.tableName).doc(data.id).delete();
      }
    } catch (error) {
      throw new DaoError({
        name: "ChatDao",
        message: "Unable to delete chat",
        id,
        error,
      });
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      const data = (await this.db.collection(this.tableName).where("id", "==", id).get()).docs[0];
      if (data) {
        await this.db.collection(this.tableName).doc(data.id).update({
          isDeleted: true,
        });
      }
    } catch (error) {
      throw new DaoError({
        name: "ChatDao",
        message: "Unable to delete chat",
        id,
        error,
      });
    }
  }
}
