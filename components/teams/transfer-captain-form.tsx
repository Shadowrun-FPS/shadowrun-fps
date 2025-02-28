"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface TeamMember {
  discordId: string;
  discordNickname: string;
  role: string;
}

interface Team {
  _id: string;
  members: TeamMember[];
}

export function TransferCaptainForm({ team }: { team: Team }) {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    if (!selectedMember) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/teams/${team._id}/transfer-captain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newCaptainId: selectedMember }),
      });

      if (!response.ok) {
        throw new Error("Failed to transfer captain role");
      }

      router.refresh();
    } catch (error) {
      console.error("Error transferring captain role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Transfer Captain Role To
        </label>
        <Select onValueChange={setSelectedMember} value={selectedMember}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select a member" />
          </SelectTrigger>
          <SelectContent>
            {team.members
              .filter((member) => member.role === "member")
              .map((member) => (
                <SelectItem key={member.discordId} value={member.discordId}>
                  {member.discordNickname}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleTransfer}
        disabled={!selectedMember || isLoading}
        variant="destructive"
      >
        {isLoading ? "Transferring..." : "Transfer Captain Role"}
      </Button>
    </div>
  );
}
