import WAWebJS from "whatsapp-web.js";
import { ChatDTO } from "../entities/Chat";
import { MessageDTO } from "../entities/Message";
import { getBotClient, getPhoneFromBotId } from "./botClient";
import { Encrypter } from "./crypt";
import { firestore, messageDao } from "./dependencies";

/**
 * Retrive and
 * @param chatDto
 * * Task
 * - run transaction
 * - encrypt message
 * - save message information to db
 * - download message media and upload to google cloud storage
 */
export default async function saveMessages(
  chatDto: ChatDTO,
  messages: WAWebJS.Message[]
): Promise<void> {
  const phone = getPhoneFromBotId(chatDto.botId);
  const client = await getBotClient(String(phone));

  if (!client) {
    throw new Error("No client found");
  }

  await firestore.runTransaction(async (transaction) => {
    // initiate transaction
    messageDao.transaction = transaction;

    const _messages = messages.map(async (message) => {
      if (!message.author || message.fromMe) {
        return;
      }

      const encryptedMessage = Encrypter.encrypt(
        message.body,
        String(process.env.MESSAGE_CRYPTO_KEY)
      );

      const payload: MessageDTO = {
        id: message.id._serialized,
        chatId: chatDto.id,
        content: encryptedMessage,
        createdAt: +new Date(message.timestamp),
        sentBy: message.author,
        sentTo: chatDto.botId,
        mentionedIds: message.mentionedIds.map((mention) => mention._serialized),
      };

      // TODO: check if message has media then download media and upload to R2
      if (message.hasMedia) {
        console.log("image download not implemented");
      }

      await messageDao.create(payload);
    });

    await Promise.all(_messages);
  });
}
