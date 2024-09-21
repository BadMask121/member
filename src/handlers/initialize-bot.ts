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
export default async function InitializeBot(req: RequestPayload): Promise<RequestPayload> {
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
    return req;
  } catch (error) {
    // send failure to whatsapp
    await client?.sendMessage(chatDto.id, "Member failed to initialize");
    throw new Error("Unable to initialise bot");
  }
}
