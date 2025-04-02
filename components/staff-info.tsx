import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Define an interface for the component props
interface StaffInfoProps {
  name: string;
  roles: string[];
  avatarUrl: string;
}

export function StaffInfo({ name, roles, avatarUrl }: StaffInfoProps) {
  return (
    <div className="flex items-center p-4 space-x-4 rounded-lg bg-slate-100">
      <Avatar>
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback>
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{name}</p>
        <div className="flex mt-1 space-x-2">
          {roles.map((role, index) => (
            <Badge key={index} variant="secondary">
              {role}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
