"use client";

import { useEffect } from "react";

export function OnlineStatus() {
  useEffect(() => {
    const handleOnline = () => {
      console.log("Browser back online, refreshing session");
      window.location.reload();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
