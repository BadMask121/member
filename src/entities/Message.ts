export interface Message {
  id: string;
  chatId: string;
  content: string;
  command: string;
  sentBy: string | null;
  sentTo: string | null;
  mentionedIds?: string[];
  createdAt: number;
}

export interface MessageDTO {
  id: string;
  chatId: string;
  content: string;
  command?: string;
  sentBy: string;
  sentTo?: string;
  mentionedIds?: string[];
  createdAt: number;
}
