import { ReactNode } from "react";

export type TeamNumber = 1 | 2;

export interface Player {
  elo: ReactNode;
  discordId: string;
  discordUsername: string;
  discordNickname: string;
  joinedAt: string | Date;
  discordProfilePicture?: string;
}

export interface Video {
  src: string | undefined;
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl: string;
  publishedAt: Date;
  duration?: string;
  tags?: string[];
  category: string;
}