export enum AIModel {
  GPT_3_5 = "gpt-3.5-turbo",
  GPT_4_O_mini = "gpt-4o-mini",
  GPT_4_O = "gpt-4o",
  GPT_4 = "gpt-4",
}

export enum MessageTypes {
  System = "system",
  Assistant = "assistant",
  User = "user",
}

export interface MediaContent {
  type: string;
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface Message {
  role: MessageTypes;
  content: string;
}

export interface MediaMessage {
  role: MessageTypes;
  content: MediaContent[];
}
