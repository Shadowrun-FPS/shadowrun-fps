import { ReactNode } from "react";
import { InvitePlayerModal } from "@/components/teams/invite-player-modal";

export default function TeamsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Existing layout */}
      {children}

      {/* Add invite player modal */}
      <InvitePlayerModal />
    </>
  );
}
