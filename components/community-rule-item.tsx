"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Rule } from "@/types/moderation";
import { Button } from "@/components/ui/button";

interface CommunityRuleItemProps {
  rule: Rule;
  index: number;
}

export function CommunityRuleItem({ rule, index }: CommunityRuleItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-md overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-medium">
          Rule {index + 1}: {rule.title}
        </h3>
        <Button variant="ghost" size="icon" className="ml-2">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      {isExpanded && rule.description && (
        <div className="px-4 pb-4">
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: rule.description }}
          />
        </div>
      )}
    </div>
  );
}
