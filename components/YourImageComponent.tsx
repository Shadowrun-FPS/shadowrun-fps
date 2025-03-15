import Image from "next/image";
import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

<Image
  src="/serverIcon.png"
  alt="Server Icon"
  width={100}
  height={100}
  unoptimized
/>;

// Add interface for user parameter
interface UserAvatarProps {
  user: {
    avatarUrl?: string;
    name?: string;
  };
}

// Add the type to the function parameter
export function UserAvatar({ user }: UserAvatarProps) {
  return (
    <Avatar>
      <AvatarImage
        src={user.avatarUrl}
        alt={user.name || "User avatar"}
        width={48}
        height={48}
      />
      <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
    </Avatar>
  );
}

// Helper function to get user initials
function getUserInitials(name?: string): string {
  if (!name) return "?";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
