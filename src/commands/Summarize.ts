import { PubSub } from "@google-cloud/pubsub";
import { encode } from "cbor-x";
import Summarize from "../handlers/summarize";
import { getBotClient, getPhoneFromBotId } from "../lib/botClient";
import { CommandPayload, ICommand } from "./ICommand";

export class SummarizeCommand implements ICommand {
  constructor(readonly queue: PubSub) {}

  async resolve(payload: CommandPayload): Promise<void> {
    try {
      const { botId, chatId } = payload;
      const botPhone = getPhoneFromBotId(botId);
      const client = await getBotClient(String(botPhone));
      const chat = await client?.getChatById(chatId);
      await chat?.sendStateTyping();

      const data = encode(payload);

      // if (isProd) {
      //   const [topic] = await this.queue.createTopic(QueueTopic.SUMMARIZE_CHAT);
      //   await topic.publishMessage({ data });
      // } else {
      await Summarize({
        data,
      });
      // }
    } catch (error) {
      console.log(error);
    }
  }
}
