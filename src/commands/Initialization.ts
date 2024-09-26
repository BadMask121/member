import { PubSub } from "@google-cloud/pubsub";
import { CommandPayload, ICommand } from "./ICommand";
import InitializeBot from "../handlers/initialize-bot";
import { encode } from "cbor-x";

export class InitializationCommand implements ICommand {
  constructor(readonly queue: PubSub) {}

  async resolve(payload: CommandPayload): Promise<void> {
    try {
      // const [topic] = await this.queue.createTopic(QueueTopic.INIT_CHAT);
      // await topic.publishMessage({ data: encode(payload) });
      await InitializeBot({ data: encode(payload) });
    } catch (error) {
      console.log(error);
    }
  }
}
