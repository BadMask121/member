import mongoose from "mongoose";
import qrcode from "qrcode-terminal";
import WhatsAppWeb, { Client } from "whatsapp-web.js";

import { MongoStore } from "wwebjs-mongo";

const { RemoteAuth, LocalAuth } = WhatsAppWeb;

export default class WhatsappWebClient {
  public client!: Client;

  /**
   * Starts the process of whatsapp client integration
   * MUST BE CALLED FIRST
   */
  public async init(): Promise<void> {
    console.log("init");
    // TODO: uncomment on prod
    // await mongoose.connect(String(process.env.MONGODB_URI)).catch((err) => console.log(err));

    console.log("initializing");

    // TODO: uncomment on prod
    // const store = new MongoStore({ mongoose });
    const client = new Client({
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
        defaultViewport: {
          width: 800,
          height: 600,
        },
      },
      // uncomment on prod
      // authStrategy: new RemoteAuth({
      //   store,
      //   backupSyncIntervalMs: 1000 * 60,
      // }),
      // authStrategy: new LocalAuth(),
    });

    client.initialize();

    // if (!this.client) {
    this.client = client;
    // }

    console.log("initialization complete, retriving Qr code for scanning...");

    client.on("loading_screen", (percent, message) => {
      console.log("LOADING SCREEN", percent, message);
    });

    client.on("authenticated", () => {
      console.log("AUTHENTICATED");
    });

    client.on("auth_failure", (msg) => {
      // Fired if session restore was unsuccessful
      console.error("AUTHENTICATION FAILURE", msg);
    });

    client.on("ready", async () => {
      console.log("READY");
      const debugWWebVersion = await client.getWWebVersion();
      console.log(`WWebVersion = ${debugWWebVersion}`);

      client!.pupPage?.on("pageerror", (err) => {
        console.log(`Page error: ${err.toString()}`);
      });
      client.pupPage?.on("error", (err) => {
        console.log(`Page error: ${err.toString()}`);
      });
    });

    // When the client received QR-Code
    client.on("qr", (qr) => {
      qrcode.generate(qr, { small: true });
    });
  }
}
