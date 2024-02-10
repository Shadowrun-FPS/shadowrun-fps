import updateMatchAction from "@/app/actions";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/utils";

type JoinLeaveButtonProps = {
  matchId: string;
  discordId: string | null | undefined;
  discordNickname: string | null | undefined;
};

export default function JoinLeaveButton({
  matchId,
  discordId,
  discordNickname,
}: JoinLeaveButtonProps) {
  const handleButtonClick = () => {
    const url = getApiUrl();
    fetch(url + "/api/matches", {
      method: "POST",
      body: JSON.stringify({
        action: "addPlayer",
        matchId,
        player: {
          discordId: discordId,
          discordNickname: discordNickname,
        },
      }),
    }).then(() => {
      updateMatchAction();
    });
  };
  return (
    <Button disabled={discordId === undefined} onClick={handleButtonClick}>
      {"Join"}
    </Button>
  );
}
