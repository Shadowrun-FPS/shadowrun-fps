import { Providers } from "@/components/providers";

export default function TournamentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
