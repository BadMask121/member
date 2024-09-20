import WAWebJS, { Client } from "whatsapp-web.js";
import { IMessageEvent } from "./IMessageEvent";

export default class MessageEvent implements IMessageEvent {
  constructor(readonly client: Client) {}

  /**
   * resolve message events according to their needs
   *
   * Task
   * - check if message mentions bot user
   * - check if message is from group invited to (compare with db)
   * - check if message starts with bot mentioned contact
   * - if it mentions bot user then trigger command actions e.g /summarize /initialize
   *
   * bot message format standard should be as follows
   * "{mention} {command} {action}" e.g "@+233548409552 /summarize" or "@+233548409552 /summarize today"
   * @param param0
   */
  async resolve(message: WAWebJS.Message): Promise<void> {
    const content = message.body || "";
    const mentions = await message.getMentions();
    const botMention = mentions.find((men) => men.isMe);
    const botNumber = botMention?.number || "";

    // TODO check if message is from group invited to (compare with db)

    // get structured format for the message e.g mention command action
    const [, mention, command, action] = (content?.match(/(\S+)\s+(\S+)\s+(.+)/) || []) as string[];

    console.log(content);
    // check if message starts with bot mentioned contact
    if (mention?.startsWith(`@${botNumber}`)) {
      console.log({ command, action }, "bot was mentioned");
      message.reply("thanks");
    }

    // TODO send message to trigger command actions e.g /summarize /initialize
  }
}
