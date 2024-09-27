/* eslint-disable no-param-reassign */
import WAWebJS, { Contact } from "whatsapp-web.js";
import { Message } from "../entities/Message";
import { Encrypter } from "./crypt";
import { formatDate } from "./date";

/**
 * parse message to context worthy content
 * add message sender name and date
 * @param message
 */
export async function parseMessages(msgs: Message[], client: WAWebJS.Client): Promise<string> {
  const singleMessage: Record<string, string> = {};
  const sentBy: Record<string, { author: Contact; phone: string }> = {};

  for await (const msg of msgs) {
    let author;
    let authorPhone;
    const cachedAuthor = sentBy[msg.sentBy];
    if (cachedAuthor) {
      author = cachedAuthor.author;
      authorPhone = cachedAuthor.phone;
    } else {
      author = await client.getContactById(msg.sentBy);
      authorPhone = await client.getFormattedNumber(msg.sentBy);

      sentBy[msg.sentBy] = {
        author,
        phone: authorPhone,
      };
    }

    const content = Encrypter.decrypt(msg.content, String(process.env.MESSAGE_CRYPTO_KEY));
    const authorName =
      author?.pushname ||
      author?.name ||
      author?.verifiedName ||
      author?.shortName ||
      author?.id?.user;

    if (singleMessage[msg.id]) {
      singleMessage[msg.id] += content;
    } else {
      const chatIdentifier = `At ${formatDate(msg.createdAt)}: @${authorPhone} with name ${authorName} said ${content}`;
      singleMessage[msg.id] = chatIdentifier;
    }
  }

  return Object.values(singleMessage).join("\n")?.trim();
}
