import { cn } from "@/lib/utils";
import { POST_TYPE_META } from "@/lib/post-display";
import type { PostType } from "@/types";

interface PostTypeBadgeProps {
  type: PostType;
  className?: string;
}

export function PostTypeBadge({ type, className }: PostTypeBadgeProps) {
  const meta = POST_TYPE_META[type];
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-sm sm:text-xs",
        meta.badgeClassName,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
