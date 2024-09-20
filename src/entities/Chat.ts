export interface Chat {
  id: string;
  members?: string[];
  adminId: string; // group authorId,
  botId: string; // id.participant
  isGroup?: boolean;
  isDeleted?: boolean;
  createdAt: string; // timestamp from the group notification object
}

export interface ChatDTO {
  id: string;
  botId: string; // id.participant
  adminId: string; // group authorId,
  members?: string[];
  isGroup?: boolean;
  isDeleted?: boolean;
  createdAt: string; // timestamp from the group notification object
}
