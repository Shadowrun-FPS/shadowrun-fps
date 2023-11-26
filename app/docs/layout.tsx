import { DocHero } from "@/components/doc-hero";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <DocHero /> {children}
    </div>
  );
}
