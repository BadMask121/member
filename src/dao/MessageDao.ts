import { FieldValue, Firestore, VectorQuery, VectorQuerySnapshot } from "@google-cloud/firestore";
import chunk from "lodash.chunk";
import { Message, MessageDTO } from "../entities/Message";
import { DaoError } from "../errors/dao";
import { DaoTable } from "./IDao";
import { IMessageDao } from "./IMessageDao";

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
    filter?: { from: number; to: number }
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

  async add(messages: MessageDTO[]): Promise<void> {
    try {
      const MAX_WRITES_PER_BATCH = 500; /** https://cloud.google.com/firestore/quotas#writes_and_transactions */

      const batches = chunk(messages, MAX_WRITES_PER_BATCH);
      const commitBatchPromises: Promise<FirebaseFirestore.WriteResult[]>[] = [];

      for (const batch of batches) {
        const writeBatch = this.db.batch();

        for (const doc of batch) {
          // only insert when we have no existing message id
          const snapshot = await this.db.collection(this.tableName).where("id", "==", doc.id).get();
          if (snapshot.empty) {
            const snap = this.db.collection(this.tableName).doc();
            const embedding = FieldValue.vector(doc.embedding);
            writeBatch.create(snap, {
              ...doc,
              embedding,
            });
          }
        }

        commitBatchPromises.push(writeBatch.commit());
      }

      await Promise.all(commitBatchPromises);
    } catch (error) {
      throw new DaoError({
        name: "MessageDao",
        message: "Unable to create message",
        error,
      });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const snapshot = await this.db.collection(this.tableName).where("chatId", "==", id).get();
      const MAX_WRITES_PER_BATCH = 500; /** https://cloud.google.com/firestore/quotas#writes_and_transactions */

      const batches = chunk(snapshot.docs, MAX_WRITES_PER_BATCH);
      const commitBatchPromises: Promise<FirebaseFirestore.WriteResult[]>[] = [];

      batches.forEach((batch) => {
        const writeBatch = this.db.batch();
        batch.forEach((doc) => writeBatch.delete(doc.ref));
        commitBatchPromises.push(writeBatch.commit());
      });

      await Promise.all(commitBatchPromises);
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
