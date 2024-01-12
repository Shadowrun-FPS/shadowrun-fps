import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Stats Look Up",
  openGraph: {
    title: "Stats Look Up",
  },
};

import ComingSoon from "../../coming-soon";

const StatsPage: React.FC = () => {
  return (
    <ComingSoon
      title={"Look up player stats"}
      description="Search for player stats by name to view their profile, with stats like wins/loss ratio, games played, etc."
    />
  );
};

export default StatsPage;
