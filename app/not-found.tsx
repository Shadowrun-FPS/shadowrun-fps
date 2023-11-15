import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md text-center">
        <div className="mb-4">
          <Image src="/404.png" alt="Page Not Found" width={300} height={300} />
        </div>
        <h1 className="mb-4 font-bold text-gray-900 text-8xl">404</h1>
        <p className="mb-6 text-2xl text-gray-700">Page Not Found</p>
        <Button variant="outline">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
