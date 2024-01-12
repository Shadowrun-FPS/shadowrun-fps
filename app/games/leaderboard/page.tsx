import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Leaderboard",
  openGraph: {
    title: "Leaderboard",
  },
};

import ComingSoon from "../../coming-soon";

const LeaderboardPage: React.FC = () => {
  return (
    <ComingSoon
      title={"Ranked leaderboard"}
      description="Check out the top ranked shadowrun fps players in our pick up game system."
    />
  );
};

export default LeaderboardPage;
