import { PubSub } from "@google-cloud/pubsub";
import { encode } from "cbor-x";
import { QueueTopic } from "../entities/Queue";
import { CommandPayload, ICommand } from "./ICommand";
import { getPhoneFromBotId, getBotClient } from "../lib/botClient";
import { isProd } from "../lib/env";
import Summarize from "../handlers/summarize";

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

      if (isProd) {
        const [topic] = await this.queue.createTopic(QueueTopic.SUMMARIZE_CHAT);
        await topic.publishMessage({ data });
      } else {
        await Summarize({
          data,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
}
