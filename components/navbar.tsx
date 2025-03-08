"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Users, Calendar, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/features";
import type { FeatureFlag } from "@/lib/features";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  feature: FeatureFlag;
}

// I don't want to use this navbar. Please remove.
const navItems: NavItem[] = [];

export function Navbar() {
  const pathname = usePathname();

  return;
}
