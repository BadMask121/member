export interface Message {
  id: string;
  chatId: string;
  content: string;
  sentBy: string;
  sentTo?: string | null;
  command?: string;
  mentionedIds?: string[];
  createdAt: number;
}

export interface MessageDTO {
  id: string;
  chatId: string;
  content: string;
  sentBy: string;
  embedding: number[];
  command?: string;
  sentTo?: string;
  mentionedIds?: string[];
  createdAt: number;
}
