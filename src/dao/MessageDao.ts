import { Firestore } from "@google-cloud/firestore";
import isNil from "lodash.isnil";
import omit from "lodash.omitby";
import { Message, MessageDTO } from "../entities/Message";
import { DaoError } from "../errors/dao";
import { IMessageDao } from "./IMessageDao";
import { DaoTable } from "./IDao";

export class MessageDao implements IMessageDao {
  transaction!: FirebaseFirestore.Transaction;

  constructor(
    private readonly db: Firestore,
    private readonly tableName: DaoTable
  ) {}

  async get(id: string): Promise<Message | null> {
    try {
      const docRef = this.db.collection(this.tableName).doc(id);
      let messageSnap: FirebaseFirestore.DocumentSnapshot<
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (this.transaction) {
        messageSnap = await this.transaction.get(docRef);
      } else {
        messageSnap = await docRef.get();
      }

      const chat = messageSnap.data() as Message | null;
      if (!chat) {
        return null;
      }

      return {
        ...chat,
        chatId: id,
      };
    } catch (error) {
      throw new DaoError({
        name: "MessageDao",
        message: "Unable to retrieve chat",
        chatId: id,
        error,
      });
    }
  }

  async getAllChatMessages(
    chatId: string,
    filter?: { from?: string; to?: string }
  ): Promise<Message[]> {
    try {
      let docRef = this.db
        .collection(this.tableName)
        .where("chatId", "==", chatId)
        .orderBy("createdAt", "desc");

      let messageSnap: FirebaseFirestore.QuerySnapshot<
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (filter?.from) {
        docRef = docRef.where("createdAt", ">=", filter.from);
      }

      if (filter?.to) {
        docRef = docRef.where("createdAt", "<=", filter.to);
      }

      if (this.transaction) {
        messageSnap = await this.transaction.get(docRef);
      } else {
        messageSnap = await docRef.get();
      }

      const chats = messageSnap.docs;
      if (!chats.length) {
        return [];
      }

      const allMessages = chats.map((doc) => {
        const chat = doc.data() as Message;
        return {
          ...chat,
          id: doc.id,
        };
      });

      return allMessages;
    } catch (error) {
      throw new DaoError({
        name: "MessageDao",
        message: "Unable to retrieve message",
        chatId,
        error,
      });
    }
  }

  async create(chatDto: MessageDTO): Promise<Message> {
    try {
      const payload = omit<MessageDTO>(chatDto, isNil);

      let chatRef: FirebaseFirestore.DocumentReference<
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (this.transaction) {
        chatRef = this.db.collection(this.tableName).doc();
        this.transaction.set(chatRef, payload, { merge: true });
      } else {
        await this.db.collection(this.tableName).add(payload);
      }

      return {
        ...chatDto,
        mentionedIds: chatDto.mentionedIds || [],
        command: chatDto.command || "",
        sentTo: chatDto.sentTo || null,
      };
    } catch (error) {
      throw new DaoError({
        name: "MessageDao",
        message: "Unable to create message",
        chat: chatDto,
        error,
      });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const data = (await this.db.collection(this.tableName).where("chatId", "==", id).get())
        .docs[0];

      if (data) {
        await this.db.collection(this.tableName).doc(data.id).delete();
      }
    } catch (error) {
      throw new DaoError({
        name: "MessageDao",
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
          isDeleted: false,
        });
      }
    } catch (error) {
      throw new DaoError({
        name: "MessageDao",
        message: "Unable to delete chat",
        id,
        error,
      });
    }
  }
}
