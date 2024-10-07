import WAWebJS from "whatsapp-web.js";
import { MessageDTO } from "../entities/Message";
import { getBotClient, getPhoneFromId } from "./botClient";
import { Encrypter } from "./crypt";
import { firestore, messageDao, openaiService } from "./dependencies";
import chunk from "lodash.chunk";
import { sanitizeMessage } from "./string";
import { extractCommandInfo } from "./extractCommandInfo";

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
  chatDto: { id: string; botId: string },
  messages: WAWebJS.Message[]
): Promise<void> {
  const botNumber = getPhoneFromId(chatDto.botId);
  const client = await getBotClient(String(botNumber));

  if (!client) {
    throw new Error("No client found");
  }

  try {
    await firestore.runTransaction(async (transaction) => {
      // initiate transaction
      messageDao.transaction = transaction;

      const _messages = messages.map(async (message) => {
        if (!message.author || message.fromMe || !message.body) {
          return;
        }

        const content = sanitizeMessage(message.body);
        const { mention } = extractCommandInfo(content) || {};

        // skip message containing bot operations
        if (mention?.startsWith(`@${botNumber}`)) {
          return;
        }

        /**
         * chunk messages into smaller content, generate embeddings and store as messages
         * to firestore db along with the embeddings
         */
        const embeddings = await openaiService.embeddings(content);

        const messagesToSave = embeddings.map((embed) => {
          const encryptedMessage = Encrypter.encrypt(
            embed.content,
            String(process.env.MESSAGE_CRYPTO_KEY)
          );

          const payload: MessageDTO = {
            id: message.id._serialized,
            chatId: chatDto.id,
            content: encryptedMessage,
            sentBy: String(message.author),
            sentTo: chatDto.botId,
            mentionedIds: message.mentionedIds as unknown as string[],
            embedding: embed.embedding,
            createdAt: +new Date(message.timestamp),
          };

          return payload;
        });

        // TODO: check if message has media then download media and upload to R2
        if (message.hasMedia) {
          console.log("image download not implemented");
        }

        // split into chunk of MAX 500 objects each when over 500 item
        const chunkedMessages = chunk(messagesToSave, 500);
        await Promise.all(chunkedMessages.map((messages) => messageDao.add(messages)));
      });

      await Promise.all(_messages);
    });
    // eslint-disable-next-line no-useless-catch
  } catch (error) {
    throw error;
  } finally {
    messageDao.transaction = undefined;
  }
}
