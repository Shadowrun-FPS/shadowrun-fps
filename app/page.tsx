import { Button } from "@/components/ui/button";
import FeaturedVideos from "./featured-videos";

export default function Home() {
  return (
    <>
      <div className="px-4 py-32 mx-auto bg-center bg-no-repeat bg-cover max-w-screen-2xl bg-hero-image sm:px-6 lg:flex lg:items-center lg:px-8">
        <div className="grid max-w-sm gap-4 ">
          <h1 className="text-3xl font-extrabold text-white">
            Start playing today
          </h1>
          <p className="text-white">
            Welcome to &lsquo;This Is Shadowrun&rsquo;, we&rsquo;re a fan
            community dedicated to the FASA Studios&apos; 2007 Shadowrun FPS.
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
          experience a world where the line is blurred between man, machine,
          magic, and technology. Join the shadows, forge alliances, and let the
          games begin.
        </p>
      </div>
      <div className="flex flex-col mx-auto" style={{ maxWidth: "1400px" }}>
        <div>
          <div className="mt-12 text-3xl font-bold text-center text-white md:text-5xl not-prose">
            <h1>Featured Video</h1>
          </div>

          <FeaturedVideos />
        </div>
      </div>
    </>
  );
}
