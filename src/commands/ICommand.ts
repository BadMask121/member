export interface CommandPayload {
  action?: string;
  chatId: string;
  botId: string;
}

export interface ICommand {
  resolve(payload: CommandPayload): Promise<void>;
}
