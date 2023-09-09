// import clientPromise from "../lib/mongodb";
import { Button } from "@/components/ui/button";

import Image from "next/image";

// export const connectToDB = async () => {
//   try {
//     const client = await clientPromise;
//     // Example connection to the mongo db
//     const db = client.db("ShadowrunWeb");
//     const results = await db
//       .collection("Matches")
//       .find({ match_id: "SR12345" })
//       .toArray();
//     console.log("results ", results);
//     return client;
//   } catch (e) {
//     console.error(e);
//     return false;
//   }
// };

export default function Home() {
  return (
    <main className="bg-center bg-no-repeat bg-cover bg-hero-image">
      <div className="max-w-screen-xl px-4 py-32 mx-auto sm:px-6 lg:flex lg:items-center lg:px-8">
        <div className="grid max-w-md gap-4">
          <h1 className="text-3xl font-extrabold">Start playing today</h1>
          <p>
            Welcome to ‘This Is Shadowrun’, we’re a community dedicated to the
            FASA Studios' 2007 Shadowrun FPS. It works in 2023!
          </p>
          <Button>Join a Game</Button>
        </div>
      </div>
    </main>
  );
}
