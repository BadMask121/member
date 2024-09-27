import { decode } from "cbor-x";
import { CommandPayload } from "../commands/ICommand";
import { getBotClient, getPhoneFromId } from "../lib/botClient";
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
  const chatDto = decode(data) as CommandPayload;
  const phone = getPhoneFromId(chatDto.botId);
  const client = await getBotClient(String(phone));
  try {
    if (!client) {
      throw new Error("No client found");
    }

    const chat = await client.getChatById(chatDto.chatId);
    const messages = await chat.fetchMessages({
      limit: 1000,
      fromMe: false,
    });

    await saveMessages({ id: chatDto.chatId, botId: chatDto.botId }, messages);
  } catch (error) {
    console.log(error);
    // send failure to whatsapp
    await client?.sendMessage(chatDto.chatId, "Member failed to initialize");
  }
}
