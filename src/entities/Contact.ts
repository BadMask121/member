import { ChatId } from "whatsapp-web.js";

export interface Contact extends ChatId {
  name: string;
}
