import summarize from "../handlers/summarize";
import { CommandPayload, ICommand } from "./ICommand";

export class SummarizeCommand implements ICommand {
  async resolve(payload: CommandPayload): Promise<void> {
    await summarize({
      data: payload,
    });
  }
}
