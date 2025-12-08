"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Shield } from "lucide-react";

interface TransferCaptainFormProps {
  teamId: string;
  members: any[];
}

export function TransferCaptainForm({
  teamId,
  members = [],
}: TransferCaptainFormProps) {
  const router = useRouter();
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Define eligible members first before using it in the useEffect
  const eligibleMembers = useMemo(() => {
    return Array.isArray(members)
      ? members
          .filter((m) => {
            // Skip undefined members or the captain
            if (!m) return false;

            // Accept any member with an ID who is not a captain
            return (
              m?.discordId && m?.role !== "captain" && m?.role !== "Captain"
            );
          })
          .sort((a, b) =>
            ((a?.username || a?.discordUsername || "") as string).localeCompare(
              (b?.username || b?.discordUsername || "") as string
            )
          )
      : [];
  }, [members]);

  // Now we can safely use eligibleMembers in the useEffect
  useEffect(() => {
    // Debug logging only in development
    if (process.env.NODE_ENV === "development") {
      console.log("Transfer Captain Form - Received members:", members);
      console.log("Eligible members:", eligibleMembers);
    }
  }, [eligibleMembers, members]);

  const handleTransfer = async () => {
    if (isLoading) return; // Prevent duplicate submissions
    if (!selectedMemberId) {
      toast({
        title: "No member selected",
        description: "Please select a team member to transfer captain role to.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/transfer-captain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newCaptainId: selectedMemberId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to transfer captain role");
      }

      toast({
        title: "Captain Role Transferred",
        description: "You have successfully transferred the captain role.",
      });

      router.refresh();
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error transferring captain:", error);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to transfer captain role.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <Select onValueChange={setSelectedMemberId} value={selectedMemberId}>
          <SelectTrigger className="w-full md:w-[250px]">
            <SelectValue placeholder="Select a member" />
          </SelectTrigger>
          <SelectContent>
            {eligibleMembers.length > 0 ? (
              eligibleMembers.map((member) => (
                <SelectItem key={member.discordId} value={member.discordId}>
                  {member.username ||
                    member.discordUsername ||
                    "Unknown member"}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-members" disabled>
                No eligible members found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <Button
          onClick={handleTransfer}
          disabled={!selectedMemberId || isLoading}
          className="gap-2"
        >
          <Shield className="w-4 h-4" />
          {isLoading ? "Transferring..." : "Transfer Captain Role"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Warning: This will transfer your captain privileges to the selected team
        member. This action cannot be undone.
      </p>
    </div>
  );
}
