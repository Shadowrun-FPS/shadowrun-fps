"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Loader2, Gamepad2, Users, Sparkles, AlertCircle, Shield } from "lucide-react";
import { DiscordIcon } from "@/components/icons/discord-icon";
import { useToast } from "@/components/ui/use-toast";
import { areCookiesEnabled } from "@/lib/client-utils";

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [cookiesEnabled, setCookiesEnabled] = useState<boolean | null>(null);
  const [showCookieWarning, setShowCookieWarning] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();

  // Check if cookies are enabled on mount and after redirects
  useEffect(() => {
    const checkCookies = () => {
      const enabled = areCookiesEnabled();
      setCookiesEnabled(enabled);
      if (!enabled) {
        setShowCookieWarning(true);
      }
    };
    
    checkCookies();
    // Re-check after a short delay in case we just returned from OAuth
    const timeout = setTimeout(checkCookies, 1000);
    return () => clearTimeout(timeout);
  }, []);

  // Check if user is already signed in after redirect
  useEffect(() => {
    if (session?.user && cookiesEnabled) {
      // User successfully signed in, redirect to callback URL
      setIsLoading(false);
      router.push(callbackUrl);
    } else if (cookiesEnabled === false) {
      // Cookies are blocked - check if user just returned from OAuth
      // If we're on the login page after a redirect, cookies are likely blocked
      const justReturned = searchParams?.get("error") || searchParams?.has("code");
      if (justReturned && !session?.user) {
        setShowCookieWarning(true);
        setIsLoading(false);
        toast({
          title: "Sign In Failed",
          description: "Cookies are required for authentication. Please enable cookies and try again.",
          variant: "destructive",
          duration: 7000,
        });
      }
    }
  }, [session, cookiesEnabled, callbackUrl, router, searchParams, toast]);

  const handleSignIn = async () => {
    // Check cookies before attempting sign-in
    const enabled = areCookiesEnabled();
    if (!enabled) {
      setShowCookieWarning(true);
      toast({
        title: "Cookies Required",
        description: "Please enable cookies to sign in. Authentication requires cookies to work properly.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    setShowCookieWarning(false);
    
    try {
      // OAuth requires redirect, so we use redirect: true
      // We'll check the session after redirect in the useEffect
      await signIn("discord", {
        callbackUrl: callbackUrl,
        redirect: true,
      });
      // If we get here, redirect is happening (shouldn't normally reach here)
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Sign In Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
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
          {/* Cookie Warning */}
          {showCookieWarning && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-yellow-500">
                    Cookies Required for Sign In
                  </p>
                  <p className="text-sm text-yellow-500/90">
                    Sign in requires cookies to be enabled. Please enable cookies in your browser settings and refresh the page.
                  </p>
                  <div className="text-xs text-yellow-500/80 mt-2 space-y-1">
                    <p><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</p>
                    <p><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</p>
                    <p><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">
                  {error === "OAuthAccountNotLinked"
                    ? "This account is already associated with another provider."
                    : error === "AccessDenied"
                    ? "Access denied. Please contact an administrator."
                    : "An error occurred during authentication. Please try again."}
                </p>
              </div>
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
