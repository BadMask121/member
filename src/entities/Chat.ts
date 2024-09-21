export interface Chat {
  id: string;
  members?: string[];
  adminId: string; // group authorId,
  botId: string; // phone@server
  isGroup?: boolean;
  isDeleted?: boolean;
  createdAt: number; // timestamp from the group notification object
}

export interface ChatDTO {
  id: string;
  botId: string; // phone@server
  adminId: string; // group authorId,
  members?: string[];
  isGroup?: boolean;
  isDeleted?: boolean;
  createdAt: number; // timestamp from the group notification object
}
