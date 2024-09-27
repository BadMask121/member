import { Command } from "../entities/Command";
import { getBotClient, getPhoneFromId } from "../lib/botClient";
import { CommandPayload, ICommand } from "./ICommand";

export class HelpCommand implements ICommand {
  async resolve(payload: CommandPayload): Promise<void> {
    const botPhone = getPhoneFromId(payload.botId);

    if (!botPhone) {
      throw new Error("Invalid request");
    }

    const client = await getBotClient(botPhone);

    if (!client) {
      throw new Error("client not initiated");
    }

    const helpCommand = `*Group Chat AI Assistant*

*_/${Command.Help}_*
  Bring up instruction manual

*_/${Command.Summarize}_*
  Summarize group chat activities
  *Usage*
    \`@botUsername /summarize [timeframe]\`
  *Examples*
    • \`@botUsername /summarize 12/03/2024\`
    • \`@botUsername /summarize today\`
  *Timeframe Options*
    1. Date: \`DD/MM/YYYY\`
    2. Date & Time: \`DD/MM/YYYY HH:mm:ss\`
    3. Date Range: \`DD/MM/YYYY - DD/MM/YYYY\`
    4. Date & Time Range: \`DD/MM/YYYY HH:mm:ss - DD/MM/YYYY HH:mm:ss\`
    5. Keywords: \`now\`, \`today\`, \`yesterday\`, \`last month\`

_Note: Replace @botUsername with the actual bot's phone number._`;

    await client?.sendMessage(payload.chatId, helpCommand);
  }
}
