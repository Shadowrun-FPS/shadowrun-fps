// import clientPromise from "../lib/mongodb";
import { Button } from "@/components/ui/button";

import Image from "next/image";

const videos = [
  {
    title: "Top 10 January 2023",
    src: "https://www.youtube.com/embed/XzWH-QhCD-k?si=uyo6gQUR8qE2qAhl",
  },
];
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
  // TODO make main take up rest of height on page
  // ensuring footer is always at the bottom of the page
  return (
    <>
      <div className="px-4 py-32 mx-auto bg-center bg-no-repeat bg-cover max-w-screen-2xl bg-hero-image sm:px-6 lg:flex lg:items-center lg:px-8">
        <div className="grid max-w-sm gap-4 ">
          <h1 className="text-3xl font-extrabold text-white">
            Start playing today
          </h1>
          <p className="text-white">
            Welcome to &lsquo;This Is Shadowrun&rsquo;, we&rsquo;re a community
            dedicated to the FASA Studios&apos; 2007 Shadowrun FPS. It works in
            2023!
          </p>
          <Button variant={"outline"}>Join a Game</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-12 p-12 mx-auto prose max-w-screen-2xl bg-muted dark:prose-invert md:grid-cols-2">
        <p>
          Welcome to the Shadowrun FPS website, where corporate espionage
          collides with intense battles. Whether you&apos;re a seasoned player
          or a rookie, our ranked playlist offers the perfect playground to hone
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
      <div className="flex flex-col mx-auto" style={{ maxWidth: "1400px" }}>
        <main>
          <div className="mt-12 mb-4 text-3xl font-bold text-center text-white md:text-5xl not-prose">
            <h1>Featured Video</h1>
          </div>
          <div>
            {videos.map((video, index) => (
              <section key={index} className="relative mx-4 md:mx-8">
                <iframe
                  className="rounded-md aspect-video"
                  src={video.src}
                  frameBorder="0"
                  allowFullScreen
                  style={{ width: "100%" }}
                ></iframe>
                <div className="text-center text-white">
                  <h2 className="mt-4 mb-8 text-2xl font-bold md:text-4xl not-prose">
                    {video.title}
                  </h2>
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
