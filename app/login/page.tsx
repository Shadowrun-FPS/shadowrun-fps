"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Loader2, Gamepad2, Users, Sparkles } from "lucide-react";
import { DiscordIcon } from "@/components/icons/discord-icon";
import { useToast } from "@/components/ui/use-toast";

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const { toast } = useToast();

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("discord", {
        callbackUrl: callbackUrl,
        redirect: true,
      });
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleComingSoon = (
    e: React.MouseEvent<HTMLAnchorElement>,
    page: string
  ) => {
    e.preventDefault();
    toast({
      title: "Coming Soon",
      description: `${page} is currently under development.`,
      duration: 3000,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20 px-4 relative overflow-hidden">
      {/* Static background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 p-4 flex items-center justify-center shadow-lg ring-2 ring-primary/10">
              <Image
                src="/logo.svg"
                alt="Shadowrun FPS Logo"
                width={80}
                height={80}
                className="w-full h-full object-contain drop-shadow-lg"
                priority
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Shadowrun FPS
            </h1>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-muted-foreground text-lg font-medium">
                Welcome back! Sign in to continue your journey.
              </p>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full p-8 space-y-6 rounded-xl border bg-card/60 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm text-destructive font-medium">
                {error === "OAuthAccountNotLinked"
                  ? "This account is already associated with another provider."
                  : error === "AccessDenied"
                  ? "Access denied. Please contact an administrator."
                  : "An error occurred during authentication. Please try again."}
              </p>
            </div>
          )}

          {/* Features List */}
          <div className="grid grid-cols-2 gap-4 py-6 border-y border-border/50">
            <div className="text-center space-y-3 group">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                <Gamepad2 className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
              </div>
              <p className="text-xs font-semibold text-foreground/80">Ranked Matches</p>
            </div>
            <div className="text-center space-y-3 group">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                <Users className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
              </div>
              <p className="text-xs font-semibold text-foreground/80">Team Play</p>
            </div>
          </div>

          {/* Sign In Button */}
          <Button
            className="w-full py-7 text-base font-semibold flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752c4] transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            onClick={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connecting to Discord...</span>
              </>
            ) : (
              <>
                <DiscordIcon className="w-5 h-5" />
                <span>Sign in with Discord</span>
              </>
            )}
          </Button>

          {/* Terms and Privacy */}
          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            By signing in, you agree to our{" "}
            <a
              href="#"
              onClick={(e) => handleComingSoon(e, "Terms of Service")}
              className="underline transition-colors cursor-not-allowed opacity-60 hover:opacity-80"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              onClick={(e) => handleComingSoon(e, "Privacy Policy")}
              className="underline transition-colors cursor-not-allowed opacity-60 hover:opacity-80"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 p-4 flex items-center justify-center shadow-lg ring-2 ring-primary/10">
                <Image
                  src="/logo.svg"
                  alt="Shadowrun FPS Logo"
                  width={80}
                  height={80}
                  className="w-full h-full object-contain drop-shadow-lg"
                  priority
                />
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Shadowrun FPS
            </h1>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
