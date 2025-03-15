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
    <div className="flex items-center space-x-4 p-4 bg-slate-100 rounded-lg">
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
        <div className="flex space-x-2 mt-1">
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
