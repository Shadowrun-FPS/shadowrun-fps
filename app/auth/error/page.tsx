"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Create a client component that uses the hook
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  let errorMessage = "An error occurred during authentication";

  if (error === "OAuthAccountNotLinked") {
    errorMessage = "This email is already associated with another account";
  } else if (error) {
    errorMessage = error;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <CardTitle>Authentication Error</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p>{errorMessage}</p>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button asChild>
          <Link href="/auth/signin">Back to Sign In</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Wrap it in a Suspense boundary in the page component
export default function AuthErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
