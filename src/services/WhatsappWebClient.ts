import mongoose from "mongoose";
import qrTerminal from "qrcode-terminal";
import qrcode from "qrcode";
import WhatsAppWeb, { Client } from "whatsapp-web.js";

import { MongoStore } from "wwebjs-mongo";
import { isProd } from "../lib/env";
import { BotClient } from "../entities/BotClient";

const { RemoteAuth } = WhatsAppWeb;

export default class WhatsappWebClient {
  public client!: Client;

  constructor(readonly botClient: BotClient) {}

  /**
   * Starts the process of whatsapp client integration
   * MUST BE CALLED FIRST
   */
  public async init(): Promise<void> {
    await mongoose.connect(String(process.env.MONGODB_URI)).catch((err) => this.logger(err));

    const store = new MongoStore({ mongoose });
    const { phone: botPhoneNumber, email } = this.botClient;

    this.logger(`Initializing for bot client: ${botPhoneNumber}`);

    const options: WhatsAppWeb.ClientOptions = {
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
        defaultViewport: {
          width: 800,
          height: 600,
        },
      },
    };

    if (isProd) {
      options.authStrategy = new RemoteAuth({
        clientId: botPhoneNumber,
        store,
        backupSyncIntervalMs: 1000 * 60,
      });
    }

    const client = new Client(options);

    client.initialize();

    if (!this.client) {
      this.client = client;
    }

    this.logger(`initialization complete for ${botPhoneNumber}, retriving Qr code for scanning...`);

    client.on("loading_screen", (percent, message) => {
      this.logger("LOADING SCREEN", { percent, message });
    });

    client.on("authenticated", () => {
      this.logger("AUTHENTICATED");
    });

    client.on("auth_failure", (msg) => {
      // Fired if session restore was unsuccessful
      this.logger("AUTHENTICATION FAILURE", { msg });
    });

    client.on("ready", async () => {
      this.logger("READY");
      const debugWWebVersion = await client.getWWebVersion();
      this.logger(`WWebVersion = ${debugWWebVersion}`);

      client!.pupPage?.on("pageerror", (err) => {
        this.logger(`Page error: ${err.toString()}`);
      });
      client.pupPage?.on("error", (err) => {
        this.logger(`Page error: ${err.toString()}`);
      });
    });

    /**
     * When the client received QR-Code
     * send qr code image to bot client email for them to scan
     */
    client.once("qr", async (qr) => {
      if (isProd) {
        // TODO: send image to bot client admin email for scanning
        let img = await qrcode.toDataURL(qr);
      } else {
        qrTerminal.generate(qr, { small: true });
      }
    });

    // Enable graceful stop
    process.once("SIGINT", async () => {
      if (this.client) {
        await this.destroy();
      }
    });

    process.once("SIGTERM", async () => {
      if (this.client) {
        await this.destroy();
      }
    });
  }

  private logger(message: string, options?: Record<string, unknown>): void {
    console.log(`[${this.botClient?.phone || `System`}]: ${message}`, options);
  }

  async destroy(): Promise<void> {
    await this.client.destroy();
  }
}
