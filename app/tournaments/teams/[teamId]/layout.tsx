import { Navbar } from "@/components/navbar";

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <main className="container px-4 py-8 mx-auto">{children}</main>
    </div>
  );
}
