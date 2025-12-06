"use client";

import { cn } from "@/lib/utils";
import { ChevronRight, Navigation } from "lucide-react";
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

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".sidebar-nav-container")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

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
      // Close on mobile after clicking
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="sidebar-nav-container fixed right-0 top-1/3 z-40 flex">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center rounded-l-lg shadow-lg transition-all z-50",
          "bg-card border-2 border-r-0 border-border/50",
          "hover:bg-accent/50 hover:border-primary/30",
          "backdrop-blur-sm",
          "px-2.5 py-3 sm:px-3 sm:py-4",
          isOpen && "bg-accent/50 border-primary/30"
        )}
        aria-label={isOpen ? "Close quick links" : "Open quick links"}
        aria-expanded={isOpen}
      >
        <div className="flex flex-col items-center justify-center gap-1.5">
          <Navigation
            className={cn(
              "w-4 h-4 sm:w-5 sm:h-5 transition-colors flex-shrink-0",
              isOpen ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span
            className="text-[10px] sm:text-xs font-semibold text-foreground whitespace-nowrap uppercase tracking-wider hidden sm:block flex-shrink-0"
            style={{ writingMode: "vertical-lr" }}
          >
            Quick Links
          </span>
          <ChevronRight
            className={cn(
              "w-3 h-3 sm:w-4 sm:h-4 transition-all duration-300 flex-shrink-0",
              isOpen ? "rotate-180 text-primary" : "text-muted-foreground"
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
        <div className="w-64 sm:w-72 p-3 sm:p-4 bg-card/95 backdrop-blur-md rounded-l-lg border border-r-0 border-border/50 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="mb-3 pb-2 border-b border-border/50">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navigation
            </h3>
          </div>
          <nav className="space-y-1">
            {items.map((item) => {
              const isActive = activeSection === item.href.slice(1);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleClick(e, item.href)}
                  className={cn(
                    "block px-3 py-2 text-sm rounded-md transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    "border border-transparent",
                    isActive
                      ? "bg-primary/10 text-primary border-primary/30 font-semibold shadow-sm"
                      : "text-muted-foreground hover:border-primary/20"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    )}
                    <span className={cn(isActive && "ml-0.5")}>{item.title}</span>
                  </span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
