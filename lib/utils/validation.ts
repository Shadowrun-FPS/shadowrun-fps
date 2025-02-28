import { z } from "zod";

export const PlayerSchema = z.object({
  discordId: z.string(),
  bumjamas: z.string(),
  discordNickname: z.string().optional(),
  elo: z.number().default(1500),
});

export const TeamMemberSchema = PlayerSchema.extend({
  role: z.enum(["captain", "member"]),
  joinedAt: z.date(),
});

export const TeamSchema = z.object({
  name: z.string().min(3).max(32),
  tag: z.string().min(2).max(4).toUpperCase(),
  description: z.string().max(300),
  captain: PlayerSchema,
  members: z.array(TeamMemberSchema),
  elo: z.number().default(1500),
  wins: z.number().default(0),
  losses: z.number().default(0),
});

export type ValidPlayer = z.infer<typeof PlayerSchema>;
export type ValidTeamMember = z.infer<typeof TeamMemberSchema>;
export type ValidTeam = z.infer<typeof TeamSchema>;
