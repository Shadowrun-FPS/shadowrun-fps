import { HomeSectionHeading } from "@/components/home-section-heading";
import { ScrollReveal } from "@/components/scroll-reveal";

const TIMELINE = [
  {
    year: "2007",
    title: "Shadowrun FPS ships",
    body: "FASA Studios releases the cross-platform arena shooter on Xbox 360 and Windows Vista.",
  },
  {
    year: "Community",
    title: "PC play lives on",
    body: "Fans keep matchmaking, updates, and tech support alive long after the official era.",
  },
  {
    year: "Today",
    title: "This Is Shadowrun",
    body: "This hub keeps the 2007 multiplayer shooter playable. It is not Shadowrun Returns, Dragonfall, or Hong Kong.",
  },
] as const;

export function HomeAboutSection() {
  return (
    <div className="mx-auto max-w-5xl">
      <ScrollReveal>
        <HomeSectionHeading>Why this hub exists</HomeSectionHeading>
      </ScrollReveal>

      <ScrollReveal staggerIndex={1}>
        <p className="mx-auto mb-10 max-w-3xl text-center text-lg font-medium leading-relaxed text-foreground sm:text-xl md:text-2xl">
          <span className="text-balance">
            One place for the{" "}
            <strong className="font-semibold text-primary">free launcher</strong>
            ,{" "}
            <strong className="font-semibold text-primary">matchmaking</strong>
            , and the{" "}
            <strong className="font-semibold text-primary">community</strong>{" "}
            that keeps Shadowrun FPS playable.
          </span>
        </p>
      </ScrollReveal>

      <div className="relative overflow-hidden rounded-2xl bg-card/5 p-6 backdrop-blur-sm sm:p-8 md:p-10">
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {TIMELINE.map((item, i) => (
            <ScrollReveal key={item.title} staggerIndex={i}>
              <div className="relative text-center">
                <div className="font-display text-sm font-bold uppercase tracking-wider text-primary">
                  {item.year}
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
