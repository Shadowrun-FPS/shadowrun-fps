import { User } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  user: {
    name: string | null;
    image: string | null;
    nickname: string | null;
  };
}

export function UserAvatar({ user, ...props }: UserAvatarProps) {
  return (
    <Avatar {...props}>
      {user.image ? (
        <AvatarImage alt="Profile picture" src={user.image} />
      ) : (
        <AvatarFallback>
          {user.name?.[0] || user.nickname?.[0] || "U"}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
