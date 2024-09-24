import WAWebJS, { Client } from "whatsapp-web.js";
import { ICommand } from "../commands/ICommand";
import { IBotClientDao } from "../dao/IBotClientDao";
import { Command } from "../entities/Command";
import saveMessages from "../lib/save-messages";
import { IMessageEvent } from "./IMessageEvent";
import { getPhoneFromBotId } from "../lib/botClient";
import { IChatDao } from "../dao/IChatDao";

export default class MessageEvent implements IMessageEvent {
  constructor(
    readonly client: Client,
    readonly botClientDao: IBotClientDao,
    readonly chatDao: IChatDao,
    readonly commands: Record<Command, ICommand>
  ) {}

  /**
   * resolve message events according to their needs
   *
   * Task
   * - check if message mentions bot user
   * - check if message is from group invited to (compare with db)
   * - check if message starts with bot mentioned contact
   * - if it mentions bot user then trigger command actions e.g /summarize /initialize
   * - add message to db
   *
   * bot message format standard should be as follows
   * "{mention} {command} {action}" e.g "@+233548409552 /summarize" or "@+233548409552 /summarize today"
   * @param param0
   */
  async resolve(message: WAWebJS.Message): Promise<void> {
    // ignore all messages from bot
    if (!message.author || message.fromMe || !message.body) {
      return;
    }

    const chatId = message.from;

    try {
      const content = message.body || "";
      const botId = String(message.to);
      const botNumber = getPhoneFromBotId(botId) || "";
      const botClient = await this.botClientDao.getByPhone(botNumber);
      const chat = await this.chatDao.get(chatId);

      if (!botClient || !chat) {
        return;
      }

      // get structured format for the message e.g mention command action
      const [, mention, commandAction, action] = (content?.match(/(\S+)\s+(\S+)\s+(.+)/) ||
        []) as string[];

      // check if message starts with bot mentioned contact
      if (mention?.startsWith(`@${botNumber}`)) {
        const command = commandAction.replace("/", "") as Command;

        console.log({ command, action }, "bot was mentioned");
        await this.commands[command].resolve({
          action,
          botId,
          chatId,
        });

        return;
      }

      await saveMessages({ id: chatId, botId }, [message]);
      console.log("Bot saved new messages");
    } catch (error) {
      console.log(error);
      await this.client.sendMessage(chatId, "Unable to process request, please try again");
    }
  }
}
