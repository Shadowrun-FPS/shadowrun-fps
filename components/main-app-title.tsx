"use client";
import { useTheme } from "next-themes";
import MainLogo from "./logos/main-logo";
function MainAppTitle() {
  const { theme } = useTheme();
  // Determine the text color based on the theme
  const textColor = theme === "dark" ? "text-white" : "text-black";

  return (
    <div className="flex items-center">
      <MainLogo />
      <h3
        className={`ml-4 scroll-m-20 text-2xl font-semibold tracking-tight ${textColor}`}
      >
        Shadowrun FPS
      </h3>
    </div>
  );
}

export default MainAppTitle;
