import updateMatchAction from "@/app/actions";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/utils";

type LeaveButtonProps = {
  disabled: boolean;
  matchId: string;
  discordId: string | null | undefined;
};

export default function LeaveButton({
  disabled,
  matchId,
  discordId,
}: LeaveButtonProps) {
  function handleLeave() {
    const url = getApiUrl();
    fetch(url + "/api/matches", {
      method: "POST",
      body: JSON.stringify({
        action: "removePlayer",
        matchId,
        discordId: discordId,
      }),
    }).then(() => {
      updateMatchAction();
    });
  }
  return (
    <Button variant="destructive" disabled={disabled} onClick={handleLeave}>
      {"Leave"}
    </Button>
  );
}
