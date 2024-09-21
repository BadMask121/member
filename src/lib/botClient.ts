import WAWebJS from "whatsapp-web.js";
import { BotClient } from "../entities/BotClient";
import GroupChatEvent from "../events/GroupChatEvent";
import MessageEvent from "../events/MessageEvent";
import WhatsappWebClient from "../services/WhatsappWebClient";
import { botClientDao, chatDao, pubSub } from "./dependencies";

export async function createBotWebClient(botClient: BotClient): Promise<WAWebJS.Client> {
  /** create a new whatsapp instance for every bot client */
  const whatsApp = new WhatsappWebClient(botClient);
  await whatsApp.init();

  const messageEvent = new MessageEvent(whatsApp.client);
  const groupChatEvent = new GroupChatEvent(whatsApp.client, chatDao, botClientDao, pubSub);

  whatsApp.client.on("message", (msg) => messageEvent.resolve(msg));
  whatsApp.client.on("group_join", (notification) => groupChatEvent.join(notification));
  whatsApp.client.on("group_leave", (notification) => groupChatEvent.leave(notification));

  return whatsApp.client;
}

export async function closeBotWebClient(botClient: BotClient): Promise<void> {
  /** create a new whatsapp instance for every bot client */
  const whatsApp = new WhatsappWebClient(botClient);
  await whatsApp.destroy();
}

export async function getBotClient(botPhone: string): Promise<WAWebJS.Client | null> {
  const botClient = await botClientDao.getByPhone(botPhone);
  if (!botClient) {
    return null;
  }

  return createBotWebClient(botClient);
}

export function getPhoneFromBotId(botId: string): string | null {
  const [phone] = botId.split("@") || [];
  return phone || null;
}
