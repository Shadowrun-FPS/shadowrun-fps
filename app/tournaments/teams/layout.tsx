import { ReactNode } from "react";
import { InvitePlayerModal } from "@/components/teams/invite-player-modal";
import { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Teams | Shadowrun FPS",
  description: "Browse, create and manage competitive teams",
};

export default function TeamsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
        {children}
      </div>

      {/* Add invite player modal */}
      <InvitePlayerModal />
      <Toaster />
    </>
  );
}
