"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Shield,
  Users,
  Book,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalPlayers: number;
  activeBans: number;
  totalRules: number;
  recentModerationActions: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats from various endpoints with error handling
        const [playersRes, moderationRes, rulesRes] = await Promise.allSettled([
          fetch("/api/admin/players?count=true"),
          fetch("/api/admin/moderation-logs?limit=1"),
          fetch("/api/admin/rules"),
        ]);

        const statsData: DashboardStats = {
          totalPlayers: 0,
          activeBans: 0,
          totalRules: 0,
          recentModerationActions: 0,
        };

        // Handle players count
        if (playersRes.status === "fulfilled") {
          const response = playersRes.value;
          if (response.ok) {
            try {
              const playersData = await response.json();
              statsData.totalPlayers = playersData.count || 0;
            } catch (e) {
              // Silently handle parsing errors
            }
          }
        }

        // Handle moderation data
        if (moderationRes.status === "fulfilled") {
          const response = moderationRes.value;
          if (response.ok) {
            try {
              const moderationData = await response.json();
              if (Array.isArray(moderationData)) {
                statsData.activeBans = moderationData.filter(
                  (log: any) => log.action === "ban" && (!log.expiry || new Date(log.expiry) > new Date())
                ).length;
                statsData.recentModerationActions = moderationData.length;
              }
            } catch (e) {
              // Silently handle parsing errors
            }
          }
        }

        // Handle rules data (may fail due to rate limiting)
        if (rulesRes.status === "fulfilled") {
          const response = rulesRes.value;
          if (response.ok) {
            try {
              const rulesData = await response.json();
              statsData.totalRules = Array.isArray(rulesData) ? rulesData.length : 0;
            } catch (e) {
              // Silently handle parsing errors
            }
          }
        }

        setStats(statsData);
      } catch (err) {
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []); // Only fetch once on mount

  const quickLinks = [
    {
      href: "/admin/players",
      icon: Users,
      title: "Manage Players",
      description: "View and manage all players",
      color: "text-blue-500",
    },
    {
      href: "/admin/moderation",
      icon: Shield,
      title: "Moderation",
      description: "View moderation logs and actions",
      color: "text-red-500",
    },
    {
      href: "/admin/rules",
      icon: Book,
      title: "Rules",
      description: "Manage community rules",
      color: "text-green-500",
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8 lg:space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{session?.user?.nickname || session?.user?.name || "Admin"}</span>
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                {stats?.totalPlayers || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Active Bans</CardTitle>
            <div className="p-2 rounded-lg bg-red-500/10">
              <Shield className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                {stats?.activeBans || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <Book className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                {stats?.totalRules || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Recent Actions</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                {stats?.recentModerationActions || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Quick Links</h2>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl cursor-pointer h-full bg-gradient-to-br from-background to-muted/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${link.color === "text-blue-500" ? "from-blue-500/20 to-blue-500/10" : link.color === "text-red-500" ? "from-red-500/20 to-red-500/10" : "from-green-500/20 to-green-500/10"} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-5 w-5 ${link.color}`} />
                      </div>
                      <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">{link.title}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">{link.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Section */}
      <Card className="border-2 bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Recent Activity</CardTitle>
          <CardDescription>Latest moderation actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              View detailed activity in the{" "}
              <Link href="/admin/moderation" className="text-primary hover:underline font-medium">
                Moderation
              </Link>{" "}
              section
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

