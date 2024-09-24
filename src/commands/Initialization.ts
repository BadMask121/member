import { encode } from "cbor-x";
import InitializeBot from "../handlers/initialize-bot";
import { CommandPayload, ICommand } from "./ICommand";

export class InitializationCommand implements ICommand {
  async resolve(payload: CommandPayload): Promise<void> {
    // TODO: use for prod
    // const [topic] = await this.queue.createTopic(QueueTopic.INIT_CHAT);

    // Send a message to the topic
    // over the network encoding with cbor algorigthm
    // TODO: use for prod
    // await topic.publishMessage({ data });

    // TODO: for only testing
    await InitializeBot({ data: encode(payload) });

    // // Creates a subscription on that new topic
    // const [subscription] = await topic.createSubscription(QueueTopic.INIT_CHAT);

    // // Receive callbacks for new messages on the subscription
    // subscription.on("message", (message) => {
    //   console.log("Received message:", message.data.toString());
    //   process.exit(0);
    // });

    // // Receive callbacks for errors on the subscription
    // subscription.on("error", (error) => {
    //   console.error("Received error:", error);
    //   process.exit(1);
    // });
  }
}
