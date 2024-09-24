import { FieldValue, Firestore, VectorQuery, VectorQuerySnapshot } from "@google-cloud/firestore";
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

  async similaritySearch(chatId: string, vectorValue: number[]): Promise<Message[]> {
    try {
      const coll = this.db.collection(this.tableName);
      const vectorQuery: VectorQuery = coll
        .select(...["id", "chatId", "content", "sentBy", "sentTo", "mentionedIds", "createdAt"])
        .where("chatId", "==", chatId)
        .findNearest({
          vectorField: "embedding",
          queryVector: vectorValue,
          limit: 10,
          distanceMeasure: "COSINE",
        });

      const vectorQuerySnapshot: VectorQuerySnapshot = await vectorQuery.get();

      const messages = vectorQuerySnapshot.docs.map((doc) => doc.data()) as Message[];

      return messages;
    } catch (error) {
      throw new DaoError({
        name: "similaritySearch",
        message: "Unable to retrieve chat",
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
        .select(...["id", "chatId", "content", "sentBy", "sentTo", "mentionedIds", "createdAt"])
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

      const allMessages = chats.map((doc) => doc.data()) as Message[];
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

      const embedding = FieldValue.vector(payload.embedding);

      if (this.transaction) {
        chatRef = this.db.collection(this.tableName).doc();
        this.transaction.set(chatRef, {
          ...payload,
          embedding,
        });
      } else {
        await this.db.collection(this.tableName).add({ ...payload, embedding });
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
