import { CommandPayload, ICommand } from "./ICommand";

export class SummarizeCommand implements ICommand {
  async resolve(payload: CommandPayload): Promise<void> {
    console.log(payload);
  }
}
