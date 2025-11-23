"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={300} // Refetch session every 5 minutes (300 seconds)
      refetchOnWindowFocus={false} // Don't refetch on window focus to reduce requests
    >
      {children}
    </SessionProvider>
  );
}
