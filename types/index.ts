export interface User {
  _id: string;
  discordId: string;
  username: string;
  nickname?: string | null;
  image?: string | null;
  roles?: string[];
}

export interface Player {
  _id: string;
  discordId: string;
  elo: number;
}

export interface TeamMember {
  discordId: string;
  discordUsername: string;
  discordNickname?: string | null;
  discordProfilePicture?: string | null;
  role?: string;
  joinedAt?: string;
  elo?: number;
}

export interface Team {
  _id: string;
  name: string;
  tag: string;
  description?: string;
  teamElo?: number;
  members: TeamMember[];
  captain: TeamMember;
}
