"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OnlineStatus() {
  const router = useRouter();
  
  useEffect(() => {
    const handleOnline = () => {
      if (process.env.NODE_ENV === "development") {
        console.log("Browser back online, refreshing session");
      }
      router.refresh();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [router]);

  return null;
}
