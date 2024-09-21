export interface BotClient {
  id: string;
  /**
   * group chat admin email
   */
  email: string;
  /**
   * bot phone number
   */
  phone: string;
  /**
   * phone number of group admin
   */
  adminPhone: string;
  /**
   * Number of groups invited to
   */
  inviteCount: number;
  /**
   * botId from whatsapp web
   */
  botId: string;
  createdAt: number;
}

export interface BotClientDTO {
  /**
   * group chat admin email
   */
  email: string;
  /**
   * bot phone number
   */
  phone: string;
  /**
   * phone number of group admin
   */
  adminPhone: string;
  /**
   * Number of groups invited to
   */
  inviteCount?: number;
  /**
   * botId from whatsapp web
   */
  botId?: string;
  createdAt: number;
}
