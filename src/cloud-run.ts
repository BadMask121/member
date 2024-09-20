import "dotenv/config";

import MessageEvent from "./events/MessageEvent";
import WhatsappWebClient from "./services/WhatsappWebClient";
import GroupChatEvent from "./events/GroupChatEvent";
import { ChatDao } from "./dao/ChatDao";
import { Firestore } from "@google-cloud/firestore";
import { PubSub } from "@google-cloud/pubsub";
import { DaoTable } from "./dao/IDao";

let firestore!: Firestore;
let pubSub!: PubSub;
let whatsApp!: WhatsappWebClient;

if (!firestore) {
  firestore = new Firestore();
}

if (!pubSub) {
  pubSub = new PubSub();
}

if (!whatsApp) {
  whatsApp = new WhatsappWebClient();
  await whatsApp.init();
}

// Dao dependencies
const chatDao = new ChatDao(firestore, DaoTable.Chat);

// Event dependencies
const messageEvent = new MessageEvent(whatsApp.client);
const groupChatEvent = new GroupChatEvent(whatsApp.client, chatDao, pubSub);

whatsApp.client.on("message", (msg) => messageEvent.resolve(msg));
whatsApp.client.on("group_join", (notification) => groupChatEvent.join(notification));
whatsApp.client.on("group_leave", (notification) => groupChatEvent.leave(notification));
