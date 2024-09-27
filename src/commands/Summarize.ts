import { PubSub } from "@google-cloud/pubsub";
import { encode } from "cbor-x";
import Summarize from "../handlers/summarize";
import { getBotClient, getPhoneFromId } from "../lib/botClient";
import { CommandPayload, ICommand } from "./ICommand";

export class SummarizeCommand implements ICommand {
  constructor(readonly queue: PubSub) {}

  async resolve(payload: CommandPayload): Promise<void> {
    try {
      const { botId, chatId } = payload;
      const botPhone = getPhoneFromId(botId);
      const client = await getBotClient(String(botPhone));
      const chat = await client?.getChatById(chatId);
      chat?.sendStateTyping();

      const data = encode(payload);

      await Summarize({ data });
    } catch (error) {
      console.log(error);
    }
  }
}
