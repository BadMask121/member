import "dotenv/config";

import MessageEvent from "./events/MessageEvent";
import WhatsappWebClient from "./services/WhatsappWebClient";
import GroupChatEvent from "./events/GroupChatEvent";
import { ChatDao } from "./dao/ChatDao";
import { Firestore } from "@google-cloud/firestore";
import { DaoTable } from "./dao/IDao";

const firestore = new Firestore();

let whatsApp!: WhatsappWebClient;

if (!whatsApp) {
  whatsApp = new WhatsappWebClient();
  await whatsApp.init();
}

// Dao dependencies
const chatDao = new ChatDao(firestore, DaoTable.Chat);

// Event dependencies
const messageEvent = new MessageEvent(whatsApp.client);
const groupChatEvent = new GroupChatEvent(whatsApp.client, chatDao);

whatsApp.client.on("message", (msg) => messageEvent.resolve(msg));
whatsApp.client.on("group_join", (notification) => groupChatEvent.join(notification));
whatsApp.client.on("group_leave", (notification) => groupChatEvent.leave(notification));
