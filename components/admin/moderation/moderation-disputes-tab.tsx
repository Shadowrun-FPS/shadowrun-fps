"use client";

import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { Dispute } from "@/types/moderation";

interface ModerationDisputesTabProps {
  loading: boolean;
  disputes: Dispute[];
  onViewDispute: (dispute: Dispute) => void;
}

export function ModerationDisputesTab({
  loading,
  disputes,
  onViewDispute,
}: ModerationDisputesTabProps) {
  return (
    <TabsContent value="disputes" className="mt-0">
      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : disputes.length > 0 ? (
          disputes.map((dispute) => (
            <Card
              key={dispute._id}
              className="border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background to-muted/20"
            >
              <CardContent className="pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-base sm:text-lg">{dispute.playerName}</p>
                      <div className="text-sm text-muted-foreground">
                        Submitted {formatTimeAgo(new Date(dispute.createdAt))}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDispute(dispute)}
                      className="min-h-[44px] sm:min-h-0"
                    >
                      Review
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dispute Reason:</p>
                    <p className="text-sm">{dispute.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Original Action:</p>
                    <p className="text-sm">
                      {dispute.moderationAction.type === "warning" ? "Warning" : "Ban"} by{" "}
                      {dispute.moderationAction.moderatorName}
                    </p>
                    <p className="text-sm">{dispute.moderationAction.reason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col justify-center items-center h-48 text-center">
            <Shield className="mb-4 w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">No pending disputes</p>
          </div>
        )}
      </div>
    </TabsContent>
  );
}
