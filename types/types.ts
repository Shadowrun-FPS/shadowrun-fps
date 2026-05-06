import { ReactNode } from "react";

export type TeamNumber = 1 | 2;

export interface Post {
  src: string;
  altText: string;
  linkAddress: string;
  datePublished: ReactNode;
  _id?: string;
  title: string;
  description: string;
  content: string;
  image?: string;
  imageAlt?: string;
  author?: string;
  date: Date;
  featured?: boolean;
  slug: string;
  tags?: string[];
  category: string;
}

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