"use client";
import { useTheme } from "next-themes";

function MainLogo() {
  const { theme } = useTheme();

  // Define the fill color based on the theme
  const fillColor = theme === "light" ? "black" : "white";

  return <span>Shadowrun Icon</span>;
}

export default MainLogo;
