export interface Notification {
  _id: string;
  type: "TEAM_INVITE" | "MATCH_READY" | "MATCH_COMPLETE";
  recipientId: string;
  senderId: string;
  senderName: string;
  teamId?: string;
  teamName?: string;
  matchId?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "READ";
  createdAt: number;
  message: string;
}
