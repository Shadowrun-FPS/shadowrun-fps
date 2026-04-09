"use client";

import { Button } from "@/components/ui/button";

interface QueueRegistrationBannersProps {
  isRegistered: boolean;
  isCheckingRegistration: boolean;
  isRegistering: boolean;
  missingTeamSizes: number[];
  isRegisteringMissing: boolean;
  onRegister: () => void;
  onRegisterMissing: () => void;
}

export function QueueRegistrationBanners({
  isRegistered,
  isCheckingRegistration,
  isRegistering,
  missingTeamSizes,
  isRegisteringMissing,
  onRegister,
  onRegisterMissing,
}: QueueRegistrationBannersProps) {
  return (
    <>
      {!isRegistered && !isCheckingRegistration && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-amber-500/20 bg-amber-500/5 mb-6">
          <div>
            <p className="text-sm font-medium">Register for Ranked Matchmaking</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Required before joining any queue
            </p>
          </div>
          <Button size="sm" onClick={onRegister} disabled={isRegistering} className="shrink-0">
            {isRegistering ? "Registering..." : "Register"}
          </Button>
        </div>
      )}

      {isRegistered && missingTeamSizes.length > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 mb-6">
          <div>
            <p className="text-sm font-medium">Additional Registration Needed</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add {missingTeamSizes.map((s) => `${s}v${s}`).join(", ")} to your profile. ELO
              copies from your 4v4 ladder when you have it, otherwise 800.
            </p>
          </div>
          <Button
            size="sm"
            onClick={onRegisterMissing}
            disabled={isRegisteringMissing}
            className="shrink-0"
          >
            {isRegisteringMissing ? "Registering..." : "Register"}
          </Button>
        </div>
      )}
    </>
  );
}
