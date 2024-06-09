import { Skeleton } from "../ui/skeleton";

export default function PlayerItemSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
      </div>
    </div>
  );
}
