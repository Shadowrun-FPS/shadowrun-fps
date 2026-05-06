import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HelpCircle, Home } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 – Page Not Found",
  description: "The page you are looking for doesn't exist.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        404
      </h1>
      <p className="mb-1 text-xl font-semibold text-foreground">
        Page Not Found
      </p>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild variant="default" className="gap-2 rounded-full">
          <Link href="/">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2 rounded-full">
          <Link href="/docs/troubleshoot">
            <HelpCircle className="h-4 w-4" />
            Troubleshoot
          </Link>
        </Button>
      </div>
    </div>
  );
}
