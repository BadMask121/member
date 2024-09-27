import { decode } from "cbor-x";
import { CommandPayload } from "../commands/ICommand";
import { Message as AIMessage, MediaMessage, MessageTypes } from "../entities/AI";
import { getBotClient, getPhoneFromId } from "../lib/botClient";
import { convertHumanDateTimeRange } from "../lib/date";
import { messageDao, openaiService } from "../lib/dependencies";
import { parseMessages } from "../lib/parse-messages";

interface RequestPayload {
  data: Buffer;
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
  const payload = decode(data);

  const { action, botId, chatId } = payload as CommandPayload;
  const botPhone = getPhoneFromId(botId);
  const client = await getBotClient(String(botPhone));
  const chat = await client?.getChatById(chatId);

  try {
    if (!chat) {
      throw new Error("Invalid chat");
    }

    if (!action) {
      throw new Error("Action not specified");
    }

    if (!client) {
      throw new Error("No client found");
    }

    const dateRange = convertHumanDateTimeRange(action);
    if (!dateRange) {
      await client.sendMessage(
        chatId,
        "Invalid date format, request must include a valid date e.g today, yesterday, last month, DD/MM/YYYY, or DD/MM/YYYY - DD/MM/YYYY"
      );

      return;
    }

    const messages = await messageDao.getAllChatMessages(chatId, dateRange);
    if (!messages.length) {
      await client.sendMessage(
        chatId,
        "It seems there is no chat conversation provided to summarize."
      );
      return;
    }

    const chatContext = await parseMessages(messages, client);

    const prompt: (AIMessage | MediaMessage)[] = [
      {
        role: MessageTypes.Assistant,
        content: `
As an AI assistant, your task is to create clear and concise summaries of chat conversations,
ensuring the summary does not exceed 65,536 characters, Your summaries should:

1. Capture the essence of the dialogue, highlighting key points and main ideas.
2. Present information in a compact, easily digestible format.
3. Include relevant details and examples that support main ideas.
4. Avoid unnecessary information or repetition.
5. Utilize paragraphs for improved readability and flow.
6. Tailor the summary length to match the conversation's depth and complexity.
7. Deliver a comprehensive overview without sacrificing crucial details.
8. Reflect the original conversation's tone and style when appropriate.
9. Group related topics together if multiple subjects are discussed.
10. Summary must be short and conscise

Strive to craft summaries that allow readers unfamiliar with the full conversation to quickly grasp the main points, outcomes, and any conclusions reached.
Inject creativity and warmth into your writing to ensure the summary is both informative and engaging.
`,
        // content: `
        //   You are a helpful assistant that summarizes chat conversations. You are helpful, creative, clever, and very friendly.
        //   The summary should cover all the key points and main ideas presented in the chat conversations,
        //   while also condensing the information into a concise and easy-to-understand format.
        //   Please ensure that the summary includes relevant details and examples that support the main ideas, while avoiding any unnecessary information or repetition.
        //   Format the summary in paragraph form for easy understanding.
        //   The length of the summary should be appropriate for the length and complexity of the original text,
        //   providing a clear, concise and accurate overview without omitting any important information.
        //   `,
      },
      {
        role: MessageTypes.User,
        content: `${chatContext}`,
      },
    ];

    const result = await openaiService.callWithRetry(prompt);

    await chat.clearState();
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
