"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Check, X } from "lucide-react";

interface JoinRequestActionsProps {
  requestId: string;
  teamName: string;
  userName: string;
  onActionComplete?: () => void;
}

export function JoinRequestActions({
  requestId,
  teamName,
  userName,
  onActionComplete,
}: JoinRequestActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAction = async (action: "accept" | "reject") => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/join-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} join request`);
      }

      toast({
        title: action === "accept" ? "Request Accepted" : "Request Rejected",
        description:
          action === "accept"
            ? `${userName} has been added to your team`
            : `You have rejected ${userName}'s request to join ${teamName}`,
      });

      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error: any) {
      console.error(`Error ${action}ing join request:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} the join request`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex space-x-2 mt-2">
      <Button
        size="sm"
        variant="outline"
        className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
        onClick={() => handleAction("accept")}
        disabled={isLoading}
      >
        <Check className="h-4 w-4 mr-1" />
        Accept
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
        onClick={() => handleAction("reject")}
        disabled={isLoading}
      >
        <X className="h-4 w-4 mr-1" />
        Reject
      </Button>
    </div>
  );
}
