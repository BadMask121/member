import WAWebJS, { Client } from "whatsapp-web.js";
import { IGroupEvent } from "./IGroupChatEvent";
import { IChatDao } from "../dao/IChatDao";
import { ChatDTO } from "../entities/Chat";
import _get from "lodash.get";

export default class GroupChatEvent implements IGroupEvent {
  constructor(
    readonly client: Client,
    readonly dao: IChatDao
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
    - Save chat to db
    - send message to queue to trigger initialization cloud function
   */
  async join(notification: WAWebJS.GroupNotification): Promise<void> {
    const registerBotId = this.client.info.wid.user;
    const botId = _get(notification.id, "participant");

    // check if invited user is our bot
    if (botId === registerBotId) {
      const chat: ChatDTO = {
        botId,
        id: notification.chatId,
        ownerId: notification.author,
        isGroup: true,
        isDeleted: false,
        members: notification.recipientIds,
        createdAt: new Date(notification.timestamp).toDateString(),
      };

      this.dao.create(chat);
    }

    console.log("Member bot added to group", {
      receip: notification.getRecipients(),
      contact: notification.getContact(),
      notification,
    });

    // TODO: send message to start initialization of chat
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
    });

    // delete group from db, this means bot is not longer in the group
    this.dao.softDelete(notification.chatId);
  }
}
