import MainHeader from "@/components/main-header";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <MainHeader />
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div>content</div>
      </main>
    </div>
  );
}
