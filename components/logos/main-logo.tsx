"use client";
import { useTheme } from "next-themes";
import IconDiscordLogo from "./discord-logo";

function MainLogo() {
  const { theme } = useTheme();

  // Define the fill color based on the theme
  const fillColor = theme === "light" ? "black" : "white";

  return <IconDiscordLogo fill={fillColor} />;
}

export default MainLogo;
