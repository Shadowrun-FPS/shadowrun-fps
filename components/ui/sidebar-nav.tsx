"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface SidebarNavProps {
  items: {
    title: string;
    href: string;
  }[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "-20% 0px -35% 0px",
      }
    );

    document.querySelectorAll("section[id]").forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const offset = 80; // Adjust this value based on your header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="fixed right-0 top-1/3 z-40 flex">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-24 px-2 bg-white dark:bg-card rounded-l-md shadow-md hover:bg-accent/10 transition-colors z-50"
      >
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap"
            style={{ writingMode: "vertical-lr" }}
          >
            Quick
          </span>
          <span
            className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap"
            style={{ writingMode: "vertical-lr" }}
          >
            Links
          </span>
          <ChevronRight
            className={cn(
              "w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 mt-1",
              isOpen ? "rotate-180" : ""
            )}
          />
        </div>
      </button>

      {/* Quick Links Panel */}
      <div
        className={cn(
          "absolute right-0 transition-all duration-300 ease-in-out",
          isOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none"
        )}
      >
        <div className="w-72 p-4 bg-white dark:bg-card rounded-l-lg border border-r-0 shadow-lg">
          <nav className="space-y-1">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleClick(e, item.href)}
                className={cn(
                  "block px-4 py-2.5 text-sm rounded-md transition-all",
                  "hover:bg-accent hover:text-accent-foreground",
                  "border border-transparent",
                  activeSection === item.href.slice(1)
                    ? "bg-primary/10 text-primary border-primary/20 font-medium"
                    : "text-muted-foreground"
                )}
              >
                {item.title}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
