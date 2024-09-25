import { PubSub } from "@google-cloud/pubsub";
import { encode } from "cbor-x";
import { QueueTopic } from "../entities/Queue";
import { CommandPayload, ICommand } from "./ICommand";

export class InitializationCommand implements ICommand {
  constructor(readonly queue: PubSub) {}

  async resolve(payload: CommandPayload): Promise<void> {
    try {
      const [topic] = await this.queue.createTopic(QueueTopic.INIT_CHAT);
      await topic.publishMessage({ data: encode(payload) });
    } catch (error) {
      console.log(error);
    }
  }
}
