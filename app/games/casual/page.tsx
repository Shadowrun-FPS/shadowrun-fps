import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Casual Games",
  openGraph: {
    title: "Casual Games",
  },
};

import ComingSoon from "../../coming-soon";

const CasualPage: React.FC = () => {
  return (
    <ComingSoon
      title={"Casual pick up games"}
      description="Will support lots of game modes and types."
    />
  );
};

export default CasualPage;
