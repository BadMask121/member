import { decode } from "cbor-x";
import { ChatDTO } from "../entities/Chat";
import { getBotClient, getPhoneFromBotId } from "../lib/botClient";
import saveMessages from "../lib/save-messages";

interface RequestPayload {
  data: Buffer;
}

/**
 *
 * @param req
 * @returns
 */
export default async function InitializeBot(req: RequestPayload): Promise<void> {
  const { data } = req;
  const chatDto = decode(data) as ChatDTO;
  const phone = getPhoneFromBotId(chatDto.botId);
  const client = await getBotClient(String(phone));
  try {
    if (!client) {
      throw new Error("No client found");
    }

    const chat = await client.getChatById(chatDto.id);
    const messages = await chat.fetchMessages({
      limit: 1000,
    });

    await saveMessages(chatDto, messages);
    await client.sendMessage(chatDto.id, "Member initialization complete");
  } catch (error) {
    console.log(error);
    // send failure to whatsapp
    await client?.sendMessage(chatDto.id, "Member failed to initialize");
  }
}
