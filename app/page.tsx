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
    <main>
      <div className="max-w-screen-xl px-4 py-32 mx-auto bg-center bg-no-repeat bg-cover bg-hero-image sm:px-6 lg:flex lg:items-center lg:px-8">
        <div className="grid max-w-sm gap-4">
          <h1 className="text-3xl font-extrabold">Start playing today</h1>
          <p>
            Welcome to &lsquo;This Is Shadowrun&rsquo;, we&rsquo;re a community
            dedicated to the FASA Studios&apos; 2007 Shadowrun FPS. It works in
            2023!
          </p>
          <Button>Join a Game</Button>
        </div>
      </div>
      <div className="grid max-w-full grid-cols-1 gap-12 p-12 prose bg-muted dark:prose-invert md:grid-cols-2">
        <p>
          Welcome to our Shadowrun FPS Pick Up Game, where corporate espionage
          collides with intense battles. Whether you&apos;re a seasoned runner
          or a rookie, our pick-up games offer the perfect playground to hone
          skills in a unique blend of first-person shooter chaos and strategic
          RPG elements.
        </p>
        <p>
          In this dystopian future, mercenaries, hackers, and street samurais
          converge. Customize your character, navigate urban sprawls, and
          experience a world where the line between man and machine, magic and
          technology, is blurred. Join the shadows, forge alliances, and let the
          games begin.
        </p>
      </div>
    </main>
  );
}
