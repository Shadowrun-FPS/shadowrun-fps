import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-muted">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/404-image.png"
            alt="Page Not Found"
            width={500}
            height={500}
          />
        </div>
        <h3 className="mb-6 text-3xl prose dark:prose-invert">
          Page Not Found
        </h3>
        <Button variant="default">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
