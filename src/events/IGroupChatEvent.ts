import WAWebJS from "whatsapp-web.js";

export interface IGroupEvent {
  join(notification: WAWebJS.GroupNotification): Promise<void>;

  leave(notification: WAWebJS.GroupNotification): Promise<void>;
}
