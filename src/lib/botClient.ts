import WAWebJS from "whatsapp-web.js";
import { BotClient } from "../entities/BotClient";
import GroupChatEvent from "../events/GroupChatEvent";
import MessageEvent from "../events/MessageEvent";
import WhatsappWebClient from "../services/WhatsappWebClient";
import { botClientDao, chatDao, connectedClients, pubSub } from "./dependencies";

/**
 * create new bot clients
 * @param botClient
 * @returns
 */
export async function createBotWebClient(botClient: BotClient): Promise<WAWebJS.Client | null> {
  if (!botClient.phone) {
    console.log("No bot info found");
    return null;
  }

  const cachedClient = await getCachedClient(botClient.phone);

  if (cachedClient) {
    return cachedClient;
  }

  /** create a new whatsapp instance for every bot client */
  const whatsApp = new WhatsappWebClient(botClient);
  await whatsApp.init();

  const messageEvent = new MessageEvent(whatsApp.client);
  const groupChatEvent = new GroupChatEvent(whatsApp.client, chatDao, botClientDao, pubSub);

  whatsApp.client.on("message", (msg) => messageEvent.resolve(msg));
  whatsApp.client.on("group_join", (notification) => groupChatEvent.join(notification));
  whatsApp.client.on("group_leave", (notification) => groupChatEvent.leave(notification));

  connectedClients.set(botClient.phone, whatsApp.client);

  return whatsApp.client;
}

/**
 * close existing bot clients
 * @param botClient
 * @returns
 */
export async function closeBotWebClient(botClient: BotClient): Promise<void> {
  if (!botClient.phone) {
    console.log("No bot credential found");
    return;
  }

  /** create a new whatsapp instance for every bot client */
  const whatsApp = new WhatsappWebClient(botClient);
  await whatsApp.destroy();

  connectedClients.delete(botClient.phone);
}

/**
 * Retrive exisiting or create new bot client
 * @param botPhone
 * @returns
 */
export async function getBotClient(botPhone: string): Promise<WAWebJS.Client | null> {
  // if we already have connection ignore
  const cachedClient = await getCachedClient(botPhone);

  if (cachedClient) {
    return cachedClient;
  }

  const botClientInfo = await botClientDao.getByPhone(botPhone);
  if (!botClientInfo) {
    return null;
  }

  const client = await createBotWebClient(botClientInfo);
  return client || null;
}

/**
 * retrive connected cached client session
 * @param botPhone
 * @returns
 */
export async function getCachedClient(botPhone: string): Promise<WAWebJS.Client | null> {
  // if we already have connection ignore
  if (connectedClients.has(botPhone)) {
    console.log("found client for bot number...");
    const client = connectedClients.get(botPhone) as WAWebJS.Client;
    return client;
  }

  return null;
}

export function getPhoneFromBotId(botId: string): string | null {
  const [phone] = botId.split("@") || [];
  return phone || null;
}
