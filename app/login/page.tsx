"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { MessageSquare } from "lucide-react";
import { DiscordIcon } from "@/components/icons/discord-icon";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 rounded-lg shadow-lg bg-card">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Shadowrun FPS</h1>
          <p className="mt-2 text-muted-foreground">Sign in to continue</p>
        </div>

        <div className="space-y-4">
          <Button
            className="w-full py-6 flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752c4]"
            onClick={() => signIn("discord", { callbackUrl: "/" })}
          >
            <DiscordIcon className="w-5 h-5 mr-2" />
            Sign in with Discord
          </Button>
        </div>

        <p className="text-sm text-center text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
