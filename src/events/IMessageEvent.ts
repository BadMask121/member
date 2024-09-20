import WAWebJS from "whatsapp-web.js";

export interface IMessageEvent {
  resolve(message: WAWebJS.Message): Promise<void>;
}
