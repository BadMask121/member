import { Firestore } from "@google-cloud/firestore";
import isNil from "lodash.isnil";
import omit from "lodash.omitby";
import { BotClient, BotClientDTO } from "../entities/BotClient";
import { DaoError } from "../errors/dao";
import { BotClientEvent, IBotClientDao } from "./IBotClientDao";
import { DaoTable } from "./IDao";

export class BotClientDao implements IBotClientDao {
  transaction!: FirebaseFirestore.Transaction;

  constructor(
    private readonly db: Firestore,
    private readonly tableName: DaoTable
  ) {}

  on(event: BotClientEvent, callback: <T>(data: T) => Promise<void>): void {
    console.log("starting botClient listener");
    const collectionRef = this.db.collection(this.tableName);

    collectionRef.onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          const data = change.doc.data();

          switch (event) {
            case "added":
            case "removed":
              if (change.type === event) {
                await callback(data);
              }
              break;
            default:
              break;
          }
        });
      },
      (error) => {
        console.error("Error listening to collection:", error);
      }
    );
  }

  async getAll(): Promise<BotClient[]> {
    try {
      const docRef = this.db.collection(this.tableName).orderBy("createdAt", "desc");

      let botClientSnap: FirebaseFirestore.QuerySnapshot<
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (this.transaction) {
        botClientSnap = await this.transaction.get(docRef);
      } else {
        botClientSnap = await docRef.get();
      }

      const botClients = botClientSnap.docs;
      if (!botClients.length) {
        return [];
      }

      const allBotClients = botClients.map((doc) => {
        const botClient = doc.data() as BotClient;
        return {
          ...botClient,
          id: doc.id,
        };
      });

      return allBotClients;
    } catch (error) {
      throw new DaoError({
        name: "BotClientDao",
        message: "Unable to retrieve botClients",
        error,
      });
    }
  }

  async getByPhone(phoneNumber: string): Promise<BotClient | null> {
    try {
      const docRef = this.db.collection(this.tableName).where("phone", "==", phoneNumber);
      let botClientSnap: FirebaseFirestore.QuerySnapshot<
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (this.transaction) {
        botClientSnap = await this.transaction.get(docRef);
      } else {
        botClientSnap = await docRef.get();
      }

      if (!botClientSnap.docs.length) {
        return null;
      }

      const botClient = botClientSnap.docs[0].data() as BotClient | null;

      return botClient;
    } catch (error) {
      throw new DaoError({
        name: "BotClientDao",
        message: "Unable to retrieve botClient",
        error,
      });
    }
  }

  async save(botClientDto: Partial<BotClientDTO>, id?: string): Promise<Partial<BotClient>> {
    try {
      const payload = omit<Partial<BotClientDTO>>(
        { ...botClientDto, createdAt: Date.now() },
        isNil
      );
      const botClientCollection = this.db.collection(this.tableName);

      let botClientRef: FirebaseFirestore.DocumentReference<
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (id) {
        botClientRef = botClientCollection.doc(id);
      } else {
        botClientRef = botClientCollection.doc();
      }

      if (this.transaction) {
        this.transaction.set(botClientRef, payload, { merge: true });
      } else {
        await botClientRef.set(payload, { merge: true });
      }

      return {
        ...botClientDto,
        inviteCount: botClientDto.inviteCount || 0,
        id: botClientRef.id,
        botId: botClientDto.botId || "",
      };
    } catch (error) {
      throw new DaoError({
        name: "BotClientDao",
        message: "Unable to create botClient",
        botClient: botClientDto,
        error,
      });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const data = (await this.db.collection(this.tableName).where("id", "==", id).get()).docs[0];
      await this.db.collection(this.tableName).doc(data.id).delete();
    } catch (error) {
      throw new DaoError({
        name: "BotClientDao",
        message: "Unable to delete botClient",
        id,
        error,
      });
    }
  }
}
