export interface CommandPayload {
  action?: string | null;
  chatId: string;
  botId: string;
}

export interface ICommand {
  resolve(payload: CommandPayload): Promise<void>;
}
