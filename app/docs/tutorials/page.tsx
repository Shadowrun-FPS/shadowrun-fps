import Link from "next/link";
import Image from "next/image";
import { DocHero } from "@/components/doc-hero";

// Array of video data
const videos = [
  {
    title: "Optimizing Your Bloom Reduction",
    src: "https://www.youtube.com/embed/i824loqDsYI",
  },
  {
    title: "How Pistol Burst Firing Works in Shadowrun",
    src: "https://www.youtube.com/embed/baSBaoSeuls",
  },
  {
    title: "Pressing A instead of LB to buy Teleport",
    src: "https://www.youtube.com/embed/3Da9ny1Qi2g",
  },
  {
    title: "DreamImpulse - Shadowrun 2007 Montage #1",
    src: "https://www.youtube.com/embed/xEK0e0edZz8?si=W21dycgcs9N9-54E",
  },
  {
    title: "Shadowrun FPS - Community Montage 2023",
    src: "https://www.youtube.com/embed/sHoOy02hwe8?si=s-H3p40bO00dEHZm",
  },
  {
    title: "Shadowrun FPS - FASA Developer AMA",
    src: "https://www.youtube.com/embed/SAkaQb6V5jE",
  },
  // Add more video data as needed in the future
];

export default function TutorialsPage() {
  return (
    <div className="flex flex-col items-center justify-center md:flex-row">
      <main
        className="prose place-content-center lg:prose-xl dark:prose-invert"
        style={{ maxWidth: "1600px" }}
      >
        <div className="mt-12 mb-4 text-center text-white">
          <h1 className="mt-12 mb-4 text-3xl font-bold md:text-5xl not-prose">
            Shadowrun Tutorials
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-2 lg:mb-24 lg:mt-0">
          {/* Map over the videos array to dynamically generate video sections */}
          {videos.map((video, index) => (
            <section key={index} className="relative">
              <iframe
                className="w-full rounded-md aspect-video"
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
  );
}
