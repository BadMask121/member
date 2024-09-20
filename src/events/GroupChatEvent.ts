import WAWebJS, { Client } from "whatsapp-web.js";
import { IGroupEvent } from "./IGroupChatEvent";
import { IChatDao } from "../dao/IChatDao";
import { ChatDTO } from "../entities/Chat";
import _get from "lodash.get";
import { PubSub } from "@google-cloud/pubsub";
import { QueueTopic } from "../entities/Queue";
import { EventError } from "../errors/event";
import { GroupChat } from "../entities/GroupChat";

export default class GroupChatEvent implements IGroupEvent {
  constructor(
    readonly client: Client,
    readonly dao: IChatDao,
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
    - Save chat to db
    - send message to queue to trigger initialization cloud function
   */
  async join(notification: WAWebJS.GroupNotification): Promise<void> {
    await this.client.sendMessage(notification.chatId, "Member is initializing...");
    try {
      if (!notification) {
        throw new EventError({
          name: "GroupChatEvent",
          message: "Invalid notification data",
        });
      }

      const registeredBotId = this.client?.info?.wid?._serialized;
      const botId = _get(notification.id, "participant");
      const chat = (await notification.getChat()) as GroupChat;
      const adminId = notification.author;
      const adminInfo = chat.groupMetadata.participants.find(
        (part) => part?.id?._serialized === adminId
      );

      if (!botId) {
        throw new EventError({
          name: "GroupChatEvent",
          message: "Bot id must be valid",
        });
      }

      if (!chat.isGroup) {
        throw new EventError({
          name: "GroupChatEvent",
          message: "Chat must be a group chat",
        });
      }

      const chatDto: ChatDTO = {
        botId,
        id: notification.chatId,
        adminId,
        isGroup: true,
        isDeleted: false,
        members: notification.recipientIds,
        createdAt: new Date(notification.timestamp).toString(),
      };

      // check if invited user is our bot user and user who invited the bot is an admin
      // Only admin should be able to invite bot
      if (botId === registeredBotId) {
        if (adminInfo?.isAdmin || adminInfo?.isSuperAdmin) {
          await this.dao.create(chatDto);
        } else {
          throw new EventError({
            name: "GroupChatEvent",
            message: "Only admin user can invite bot",
          });
        }
      } else {
        // TODO: add group members into members db
        throw new EventError({
          name: "GroupChatEvent",
          message: "Only valid bot can be invited",
        });
      }

      const [topic] = await this.queue.createTopic(QueueTopic.INIT_CHAT);
      // Send a message to the topic
      topic.publishMessage({ data: Buffer.from(JSON.stringify(chatDto)) });

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
    } catch (error) {
      await this.client.sendMessage(notification.chatId, "Member is failed to initialize");
    }
  }

  /**
   * when user leave group remove the receipient information from db
   * @param notification
   */
  async leave(notification: WAWebJS.GroupNotification): Promise<void> {
    console.log("Member bot left group", {
      receip: notification.getRecipients(),
      contact: notification.getContact(),
      notification,
      this: this,
    });

    // delete group from db, this means bot is not longer in the group
    await this.dao.softDelete(notification.chatId);
  }
}
