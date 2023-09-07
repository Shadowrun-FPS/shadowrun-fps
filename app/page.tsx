import ComingSoon from "./comingsoon";
import clientPromise from "../lib/mongodb";

export const connectToDB = async () => {
  try {
    const client = await clientPromise;
    // Example connection to the mongo db
    const db = client.db("ShadowrunWeb");
    const results = await db
      .collection("Matches")
      .find({ match_id: "SR12345" })
      .toArray();
    console.log("results ", results);
    return client;
  } catch (e) {
    console.error(e);
    return false;
  }
};

export default function Home() {
  connectToDB();
  return (
    <main className="flex flex-col items-center justify-between min-h-screen p-24">
      <ComingSoon />
      {/* <MatchCard /> */}
    </main>
  );
}
