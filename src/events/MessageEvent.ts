import WAWebJS, { Client } from "whatsapp-web.js";
import { ICommand } from "../commands/ICommand";
import { IBotClientDao } from "../dao/IBotClientDao";
import { Command } from "../entities/Command";
import saveMessages from "../lib/save-messages";
import { IMessageEvent } from "./IMessageEvent";
import { getPhoneFromId } from "../lib/botClient";
import { IChatDao } from "../dao/IChatDao";
import { extractCommandInfo } from "../lib/extractCommandInfo";
import { sanitizeMessage } from "../lib/string";

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
    const chatId = message.from;

    // ignore all messages from bot
    if (!message.author || message.fromMe || !message.body) {
      console.log("Message not valid", {
        author: message.author,
        fromMe: message.fromMe,
        bodyLength: message.body.length,
        client: this.client?.info?.wid?._serialized,
      });
      return;
    }

    try {
      const botId = String(message.to);
      const botNumber = getPhoneFromId(botId) || "";
      const botClient = await this.botClientDao.getByPhone(botNumber);
      const chat = await this.chatDao.get(chatId);

      if (!botClient || !chat) {
        console.log("No chat found", { chatId, botClient, message });
        return;
      }

      // get structured format for the message e.g mention command action
      const content = sanitizeMessage(message.body || "");
      const commandInfo = extractCommandInfo(content);
      const { mention, command, action } = commandInfo || {};

      // check if message starts with bot mentioned contact
      if (mention?.startsWith(`@${botNumber}`)) {
        if (!command) {
          await this.commands[Command.Help].resolve({
            botId,
            chatId,
          });
          return;
        }

        await this.commands[command].resolve({
          action,
          botId,
          chatId,
          adminEmail: botClient.email,
        });

        // send help intructions once initialization command is complete
        if (command === Command.Initialize) {
          await this.commands[Command.Help].resolve({
            botId,
            chatId,
          });
          return;
        }

        return;
      }

      await saveMessages({ id: chatId, botId }, [message]);
    } catch (error) {
      console.log(error);
      await this.client.sendMessage(chatId, "Unable to process request, please try again");
    }
  }
}
