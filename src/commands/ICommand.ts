export interface CommandPayload {
  action?: string | null;
  chatId: string;
  botId: string;
  adminEmail?: string;
}

export interface ICommand {
  resolve(payload: CommandPayload): Promise<void>;
}
