import { GroupChat as GC, GroupParticipant } from "whatsapp-web.js";

export interface GroupChatMetadata {
  id: {
    server: string;
    user: string;
    _serialized: string;
  };
  creation: number;
  owner: {
    server: string;
    user: string;
    _serialized: string;
  };
  subject: string;
  subjectTime: number;
  restrict: boolean;
  announce: boolean;
  noFrequentlyForwarded: boolean;
  membershipApprovalMode: boolean;
  memberAddMode: string;
  reportToAdminMode: boolean;
  size: number;
  support: boolean;
  suspended: boolean;
  terminated: boolean;
  isLidAddressingMode: boolean;
  isParentGroup: boolean;
  isParentGroupClosed: boolean;
  defaultSubgroup: boolean;
  generalSubgroup: boolean;
  hiddenSubgroup: boolean;
  generalChatAutoAddDisabled: boolean;
  allowNonAdminSubGroupCreation: boolean;
  lastReportToAdminTimestamp: string | null;
  incognito: boolean;
  hasCapi: boolean;
  participants: GroupParticipant[];
  pendingParticipants: GroupParticipant[];
  pastParticipants: GroupParticipant[];
  membershipApprovalRequests: string[];
  subgroupSuggestions: string[];
}
export type GroupChat = GC & { groupMetadata: GroupChatMetadata };
