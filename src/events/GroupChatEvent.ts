import { PubSub } from "@google-cloud/pubsub";
import { encode } from "cbor-x";
import _get from "lodash.get";
import WAWebJS, { Client } from "whatsapp-web.js";
import { IBotClientDao } from "../dao/IBotClientDao";
import { IChatDao } from "../dao/IChatDao";
import { IMessageDao } from "../dao/IMessageDao";
import { ChatDTO } from "../entities/Chat";
import { GroupChat } from "../entities/GroupChat";
import { EventError } from "../errors/event";
import InitializeBot from "../handlers/initialize-bot";
import { getPhoneFromBotId } from "../lib/botClient";
import { firestore } from "../lib/dependencies";
import { IGroupEvent } from "./IGroupChatEvent";
import { ICommand } from "../commands/ICommand";
import { Command } from "../entities/Command";

export default class GroupChatEvent implements IGroupEvent {
  constructor(
    readonly client: Client,
    readonly chatDao: IChatDao,
    readonly botClientDao: IBotClientDao,
    readonly messageDao: IMessageDao,
    readonly commands: Record<Command, ICommand>,
    readonly queue: PubSub
  ) {}

  /**
   * when user join group add the receipient information to db
   * and start initialization process
   * @param notification 
   *  notification: GroupNotification {
    id: {
      fromMe: false,
      remote: '120363317128975852@g.us',
      id: '36435137321726785260',
      participant: '2348106577963@c.us',
      _serialized: 'false_120363317128975852@g.us_36435137321726785260_2348106577963@c.us'
    },
    body: '',
    type: 'add',
    timestamp: 1726785260,
    chatId: '120363317128975852@g.us',
    author: '233548409552@c.us',
    recipientIds: [ '2348106577963@c.us' ]
  }
    Task
    - Check if author is admin
    - Check if bot number belong to admin author
    - Check if invite count more than 1 (This means phone number has already been added to a group)
    - Save chat to db
    - increate bot client invite count by 1
    - send message to queue to trigger initialization cloud function
   */
  async join(notification: WAWebJS.GroupNotification): Promise<void> {
    await this.client.sendMessage(notification.chatId, "Member is initializing...");
    const botId = String(_get(notification.id, "participant"));

    if (!botId) {
      throw new EventError({
        name: "GroupChatEvent",
        message: "Bot id must be valid",
      });
    }

    const botPhone = getPhoneFromBotId(botId);

    try {
      const result = await firestore.runTransaction(async (tx) => {
        this.chatDao.transaction = tx;
        this.botClientDao.transaction = tx;

        const botClient = await this.botClientDao.getByPhone(String(botPhone));
        const adminEmail = botClient?.email;

        if (!botClient) {
          throw new EventError({
            botId,
            name: "GroupChatEvent",
            message: "Bot client not connected",
          });
        }

        if (!notification) {
          throw new EventError({
            botId,
            adminEmail,
            name: "GroupChatEvent",
            message: "Invalid notification data",
          });
        }

        const registeredBotId = this.client?.info?.wid?._serialized;
        const chat = (await notification.getChat()) as GroupChat;
        const adminId = notification.author;
        const adminInfo = chat.groupMetadata.participants.find(
          (part) => part?.id?._serialized === adminId
        );
        const adminNumber = adminInfo?.id.user;

        if (!chat.isGroup) {
          throw new EventError({
            botId,
            adminEmail,
            name: "GroupChatEvent",
            message: "Chat must be a group chat",
          });
        }

        // check if invited user is our bot user and user who invited the bot is an admin
        if (botId !== registeredBotId) {
          throw new EventError({
            botId,
            adminEmail,
            name: "GroupChatEvent",
            message: "Only valid bot can be invited",
          });
        }

        // Only admin should be able to invite bot
        if (!adminInfo?.isAdmin || !adminInfo?.isSuperAdmin) {
          throw new EventError({
            botId,
            adminEmail,
            name: "GroupChatEvent",
            message: "Only admin user can invite bot",
          });
        }

        if (!botClient) {
          throw new EventError({
            botId,
            adminEmail,
            name: "GroupChatEvent",
            message: "Invalid bot info",
          });
        }

        // Check if bot number belong to admin
        if (botClient.adminPhone !== adminNumber) {
          throw new EventError({
            botId,
            adminEmail,
            name: "GroupChatEvent",
            message: "Bot was not initiated by the right admin",
          });
        }

        // limit how many group chat bot can be invited to
        if (botClient.inviteCount >= 1) {
          throw new EventError({
            botId,
            adminEmail,
            name: "GroupChatEvent",
            message: "Bot has already been invited to a group chat",
          });
        }

        const chatDto: ChatDTO = {
          botId,
          id: notification.chatId,
          adminId,
          isGroup: true,
          isDeleted: false,
          members: notification.recipientIds,
          createdAt: +new Date(notification.timestamp),
        };

        await Promise.all([
          // // TODO: add group members into members object array
          this.chatDao.save(chatDto),
          // increase invite count
          this.botClientDao.update(botClient.id, {
            inviteCount: (botClient.inviteCount || 0) + 1,
          }),
        ]);

        return { botClient, chatDto };
      });

      this.botClientDao.transaction = undefined;
      this.chatDao.transaction = undefined;

      await this.commands[Command.Initialize].resolve({
        botId,
        chatId: result.chatDto.id,
      });
    } catch (error) {
      console.log(error);
      await this.client.sendMessage(notification.chatId, "Member is failed to initialize");
    }
  }

  /**
   * when user leave group remove the receipient information from db
   *
   * Task
   * - Soft delete chat dao
   * - Decrease bot client inviteCount by 1
   * @param notification
   */
  async leave(notification: WAWebJS.GroupNotification): Promise<void> {
    try {
      await firestore.runTransaction(async (tx) => {
        this.chatDao.transaction = tx;
        this.botClientDao.transaction = tx;
        this.messageDao.transaction = tx;

        const botId = String(_get(notification.id, "participant"));
        const botPhone = getPhoneFromBotId(botId);
        const botClient = await this.botClientDao.getByPhone(String(botPhone));

        if (!botClient) {
          throw new EventError({
            botId,
            name: "GroupChatEvent",
            message: "Bot client not connected",
          });
        }

        // TODO: delete messages in db and vector store
        await Promise.all([
          // delete group from db, this means bot is not longer in the group
          this.chatDao.delete(notification.chatId),
          // increase invite count
          this.botClientDao.update(botClient.id, { inviteCount: (botClient.inviteCount || 1) - 1 }),
          this.messageDao.delete(notification.chatId),
        ]);

        console.log("Member bot left group", {
          notification,
          botClient,
        });
      });

      this.botClientDao.transaction = undefined;
      this.chatDao.transaction = undefined;
      this.messageDao.transaction = undefined;
    } catch (error) {
      console.log(error);
    }
  }
}
