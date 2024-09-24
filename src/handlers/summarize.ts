import WAWebJS from "whatsapp-web.js";
import { Message } from "../entities/Message";
import { getBotClient, getPhoneFromBotId } from "../lib/botClient";
import { Encrypter } from "../lib/crypt";
import { convertHumanDateTimeRange, formatDate } from "../lib/date";
import { messageDao, openaiService } from "../lib/dependencies";
import { MediaMessage, Message as AIMessage, MessageTypes } from "../entities/AI";
import { CommandPayload } from "../commands/ICommand";

interface RequestPayload {
  data: CommandPayload;
}

/**
 * Summarize messages from chat
 * retrieve messages from db according to date range specifed and feed into ai for summarization
 *  Task
 *  - convert human date action to datetime range
 *  - get all messages from db with date range filter
 *  - append message sender name as 'sender' so ai can reference it in summary
 *  - call openai with context
 * @param req
 * @returns
 */
export default async function Summarize(req: RequestPayload): Promise<void> {
  const { data } = req;
  const { action, botId, chatId } = data;
  const botPhone = getPhoneFromBotId(botId);
  const client = await getBotClient(String(botPhone));
  try {
    if (!action) {
      throw new Error("Action not specified");
    }

    const dateRange = convertHumanDateTimeRange(action);
    if (!client) {
      throw new Error("No client found");
    }

    const chat = await client?.getChatById(chatId);

    await chat.sendStateTyping();

    if (!dateRange) {
      await chat.sendMessage(
        "Invalid date format, request must include a valid date e.g today, yesterday, last month, DD/MM/YYYY, or DD/MM/YYYY - DD/MM/YYYY"
      );

      return;
    }

    const messages = await messageDao.getAllChatMessages(chatId, dateRange);

    const chatContext = (
      await Promise.all(
        messages.map(async (msg) => {
          const author = await client.getContactById(msg.sentBy);
          let singleMessage: Record<string, string> = {};

          if (singleMessage[msg.id]) {
            singleMessage = { [msg.id]: singleMessage[msg.id] };
          } else {
            const chatIdentifier = `At ${formatDate(msg.createdAt)}: ${author.pushname || author?.id?.user} said `;
            singleMessage = { [msg.id]: chatIdentifier };
          }

          return parseMessage(msg, client, singleMessage);
        })
      )
    ).join("\n\n");

    const prompt: (AIMessage | MediaMessage)[] = [
      {
        role: MessageTypes.Assistant,
        content: `
          You are a helpful assistant that summarizes content. You are helpful, creative, clever, and very friendly.
          The summary should cover all the key points and main ideas presented in the original text,
          while also condensing the information into a concise and easy-to-understand format.
          Please ensure that the summary includes relevant details and examples that support the main ideas,
          while avoiding any unnecessary information or repetition. The length of the summary should be appropriate for the length and complexity of the original text,
          providing a clear and accurate overview without omitting any important information.
          `,
      },
      {
        role: MessageTypes.User,
        content: `Please summarize the following content: ${chatContext}`,
      },
    ];

    const result = await openaiService.callWithRetry(prompt);
    await chat.sendMessage(result ?? "");
  } catch (error) {
    console.log(error);
    // send failure to whatsapp
    await client?.sendMessage(
      chatId,
      "It seem something wrong happened, please check your request and try again"
    );
  }
}

/**
 * parse message to context worthy content
 * add message sender name and date
 * @param message
 */
async function parseMessage(
  message: Message,
  client: WAWebJS.Client,
  singleMessage: { [key: string]: string }
): Promise<string> {
  const content = Encrypter.decrypt(message.content, String(process.env.MESSAGE_CRYPTO_KEY));

  // eslint-disable-next-line no-param-reassign
  singleMessage[message.id] += content;
  return singleMessage[message.id];
}
